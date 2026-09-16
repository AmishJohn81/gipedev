using System.Globalization;
using System.Data;
using GipeDev.Api.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Npgsql;

const string sourceVariable = "SOURCE_POSTGRES_CONNECTION_STRING";

var sourceConnectionString = Environment.GetEnvironmentVariable(sourceVariable);
var destinationPath = "/app/data/gipedev.db";
var replace = false;

for (var index = 0; index < args.Length; index++)
{
    switch (args[index])
    {
        case "--source" when index + 1 < args.Length:
            sourceConnectionString = args[++index];
            break;
        case "--destination" when index + 1 < args.Length:
            destinationPath = args[++index];
            break;
        case "--replace":
            replace = true;
            break;
        default:
            return Fail($"Unknown or incomplete argument: {args[index]}");
    }
}

if (string.IsNullOrWhiteSpace(sourceConnectionString))
{
    return Fail($"Set {sourceVariable} or pass --source with the Render PostgreSQL connection string.");
}

destinationPath = Path.GetFullPath(destinationPath);
if (File.Exists(destinationPath) && !replace)
{
    return Fail($"Destination already exists: {destinationPath}. Pass --replace only after confirming it is safe to replace.");
}

var destinationDirectory = Path.GetDirectoryName(destinationPath)
    ?? throw new InvalidOperationException("The destination must include a directory.");
Directory.CreateDirectory(destinationDirectory);

var temporaryPath = destinationPath + $".import-{Guid.NewGuid():N}.tmp";

try
{
    var sourceConnection = new NpgsqlConnectionStringBuilder(sourceConnectionString)
    {
        GssEncryptionMode = GssEncryptionMode.Disable
    };
    await using var source = new NpgsqlConnection(sourceConnection.ConnectionString);
    await source.OpenAsync();
    await using var sourceTransaction = await source.BeginTransactionAsync(IsolationLevel.RepeatableRead);

    var options = new DbContextOptionsBuilder<SqliteGipeDevDbContext>()
        .UseSqlite($"Data Source={temporaryPath}")
        .Options;
    await using (var db = new SqliteGipeDevDbContext(options))
    {
        await db.Database.MigrateAsync();
    }

    await using var destination = new SqliteConnection($"Data Source={temporaryPath}");
    await destination.OpenAsync();
    await ExecuteAsync(destination, "PRAGMA foreign_keys = ON;");
    await using var transaction = await destination.BeginTransactionAsync();

    var contacts = await CopyAsync(source, sourceTransaction, destination, transaction,
        "SELECT \"Id\", \"Name\", \"Email\", \"Subject\", \"Message\", \"CreatedAtUtc\" FROM contact_submissions ORDER BY \"CreatedAtUtc\", \"Id\"",
        """INSERT INTO contact_submissions (Id, Name, Email, Subject, Message, CreatedAtUtc) VALUES ($p0, $p1, $p2, $p3, $p4, $p5)""",
        reader => new object[] { GuidText(reader, 0), reader.GetString(1), reader.GetString(2), reader.GetString(3), reader.GetString(4), TimestampText(reader, 5) });

    var pilots = await CopyAsync(source, sourceTransaction, destination, transaction,
        "SELECT \"Id\", \"Name\", \"NormalizedName\", \"CreatedAtUtc\" FROM asteroids_pilots ORDER BY \"CreatedAtUtc\", \"Id\"",
        """INSERT INTO asteroids_pilots (Id, Name, NormalizedName, CreatedAtUtc) VALUES ($p0, $p1, $p2, $p3)""",
        reader => new object[] { GuidText(reader, 0), reader.GetString(1), reader.GetString(2), TimestampText(reader, 3) });

    var scores = await CopyAsync(source, sourceTransaction, destination, transaction,
        "SELECT \"Id\", \"PilotId\", \"Score\", \"CreatedAtUtc\" FROM asteroids_scores ORDER BY \"CreatedAtUtc\", \"Id\"",
        """INSERT INTO asteroids_scores (Id, PilotId, Score, CreatedAtUtc) VALUES ($p0, $p1, $p2, $p3)""",
        reader => new object[] { GuidText(reader, 0), GuidText(reader, 1), reader.GetInt32(2), TimestampText(reader, 3) });

    await transaction.CommitAsync();
    await sourceTransaction.CommitAsync();

    var foreignKeyErrors = await ScalarLongAsync(destination, "SELECT count(*) FROM pragma_foreign_key_check;");
    if (foreignKeyErrors != 0)
    {
        throw new InvalidOperationException($"SQLite foreign-key verification found {foreignKeyErrors} error(s).");
    }

    await VerifyCountAsync(destination, "contact_submissions", contacts);
    await VerifyCountAsync(destination, "asteroids_pilots", pilots);
    await VerifyCountAsync(destination, "asteroids_scores", scores);
    await destination.CloseAsync();

    File.Move(temporaryPath, destinationPath, replace);
    Console.WriteLine($"Transfer complete: {contacts} contacts, {pilots} pilots, {scores} scores.");
    Console.WriteLine($"SQLite database: {destinationPath}");
    return 0;
}
catch (Exception exception)
{
    Console.Error.WriteLine($"Transfer failed; the existing destination was not changed. {exception.Message}");
    return 1;
}
finally
{
    if (File.Exists(temporaryPath))
    {
        File.Delete(temporaryPath);
    }
}

static async Task<long> CopyAsync(
    NpgsqlConnection source,
    NpgsqlTransaction sourceTransaction,
    SqliteConnection destination,
    System.Data.Common.DbTransaction transaction,
    string selectSql,
    string insertSql,
    Func<NpgsqlDataReader, object[]> values)
{
    await using var select = new NpgsqlCommand(selectSql, source);
    select.Transaction = sourceTransaction;
    await using var reader = await select.ExecuteReaderAsync();
    long count = 0;

    while (await reader.ReadAsync())
    {
        await using var insert = destination.CreateCommand();
        insert.Transaction = (SqliteTransaction)transaction;
        insert.CommandText = insertSql;
        var row = values(reader);
        for (var index = 0; index < row.Length; index++)
        {
            insert.Parameters.AddWithValue($"$p{index}", row[index]);
        }
        await insert.ExecuteNonQueryAsync();
        count++;
    }

    return count;
}

static string GuidText(NpgsqlDataReader reader, int ordinal) =>
    reader.GetGuid(ordinal).ToString().ToUpperInvariant();

static string TimestampText(NpgsqlDataReader reader, int ordinal)
{
    var value = reader.GetFieldValue<DateTime>(ordinal);
    return new DateTimeOffset(DateTime.SpecifyKind(value, DateTimeKind.Utc))
        .ToString("yyyy-MM-dd HH:mm:ss.FFFFFFFzzz", CultureInfo.InvariantCulture);
}

static async Task ExecuteAsync(SqliteConnection connection, string sql)
{
    await using var command = connection.CreateCommand();
    command.CommandText = sql;
    await command.ExecuteNonQueryAsync();
}

static async Task<long> ScalarLongAsync(SqliteConnection connection, string sql)
{
    await using var command = connection.CreateCommand();
    command.CommandText = sql;
    return Convert.ToInt64(await command.ExecuteScalarAsync(), CultureInfo.InvariantCulture);
}

static async Task VerifyCountAsync(SqliteConnection connection, string table, long expected)
{
    var actual = await ScalarLongAsync(connection, $"SELECT count(*) FROM {table};");
    if (actual != expected)
    {
        throw new InvalidOperationException($"Count verification failed for {table}: expected {expected}, found {actual}.");
    }
}

static int Fail(string message)
{
    Console.Error.WriteLine(message);
    Console.Error.WriteLine("Usage: dotnet GipeDev.DataTransfer.dll [--source CONNECTION] [--destination PATH] [--replace]");
    return 2;
}
