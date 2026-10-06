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
var clearAsteroids = false;
var confirmClear = false;

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
        case "--clear-asteroids":
            clearAsteroids = true;
            break;
        case "--confirm-clear":
            confirmClear = true;
            break;
        default:
            return Fail($"Unknown or incomplete argument: {args[index]}");
    }
}

destinationPath = Path.GetFullPath(destinationPath);

if (clearAsteroids)
{
    return await ClearAsteroidsAsync(destinationPath, confirmClear);
}

if (string.IsNullOrWhiteSpace(sourceConnectionString))
{
    return Fail($"Set {sourceVariable} or pass --source with the Render PostgreSQL connection string.");
}

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
        .UseSqlite($"Data Source={temporaryPath};Pooling=False")
        .Options;
    await using (var db = new SqliteGipeDevDbContext(options))
    {
        await db.Database.MigrateAsync();
    }

    await using var destination = new SqliteConnection($"Data Source={temporaryPath};Pooling=False");
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

    // EF Core uses WAL mode while migrating SQLite. Checkpoint all committed
    // pages into the main file and return to rollback journaling before the
    // atomic move; otherwise moving only the main file loses WAL-resident rows.
    await ExecuteAsync(destination, "PRAGMA wal_checkpoint(TRUNCATE);");
    await ExecuteAsync(destination, "PRAGMA journal_mode=DELETE;");
    await destination.CloseAsync();

    File.Move(temporaryPath, destinationPath, replace);
    DeleteIfExists(destinationPath + "-wal");
    DeleteIfExists(destinationPath + "-shm");
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
    DeleteIfExists(temporaryPath);
    DeleteIfExists(temporaryPath + "-wal");
    DeleteIfExists(temporaryPath + "-shm");
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

static async Task<int> ClearAsteroidsAsync(string databasePath, bool confirmed)
{
    if (!confirmed)
    {
        return Fail("Clearing Asteroids data requires --confirm-clear.");
    }

    if (!File.Exists(databasePath))
    {
        return Fail($"SQLite database does not exist: {databasePath}");
    }

    var backupPath = $"{databasePath}.backup-{DateTime.UtcNow:yyyyMMdd-HHmmss}.db";

    try
    {
        await using var database = new SqliteConnection(
            $"Data Source={databasePath};Mode=ReadWrite;Pooling=False;Default Timeout=30");
        await database.OpenAsync();
        await ExecuteAsync(database, "PRAGMA foreign_keys = ON;");

        var contactsBefore = await ScalarLongAsync(database, "SELECT count(*) FROM contact_submissions;");
        var pilotsBefore = await ScalarLongAsync(database, "SELECT count(*) FROM asteroids_pilots;");
        var scoresBefore = await ScalarLongAsync(database, "SELECT count(*) FROM asteroids_scores;");

        await using (var backup = new SqliteConnection(
                         $"Data Source={backupPath};Mode=ReadWriteCreate;Pooling=False"))
        {
            await backup.OpenAsync();
            database.BackupDatabase(backup);
        }

        await ExecuteAsync(database, "BEGIN IMMEDIATE;");
        try
        {
            await ExecuteAsync(database, "DELETE FROM asteroids_scores;");
            await ExecuteAsync(database, "DELETE FROM asteroids_pilots;");
            await ExecuteAsync(database, "COMMIT;");
        }
        catch
        {
            await ExecuteAsync(database, "ROLLBACK;");
            throw;
        }

        await VerifyCountAsync(database, "asteroids_scores", 0);
        await VerifyCountAsync(database, "asteroids_pilots", 0);
        await VerifyCountAsync(database, "contact_submissions", contactsBefore);

        var foreignKeyErrors = await ScalarLongAsync(database, "SELECT count(*) FROM pragma_foreign_key_check;");
        if (foreignKeyErrors != 0)
        {
            throw new InvalidOperationException(
                $"SQLite foreign-key verification found {foreignKeyErrors} error(s).");
        }

        await ExecuteAsync(database, "PRAGMA wal_checkpoint(PASSIVE);");

        Console.WriteLine($"Asteroids reset complete: deleted {scoresBefore} scores and {pilotsBefore} pilots.");
        Console.WriteLine($"Preserved {contactsBefore} contact submissions.");
        Console.WriteLine($"Backup: {backupPath}");
        return 0;
    }
    catch (Exception exception)
    {
        Console.Error.WriteLine($"Asteroids reset failed. {exception.Message}");
        if (File.Exists(backupPath))
        {
            Console.Error.WriteLine($"Backup retained at: {backupPath}");
        }
        return 1;
    }
}

static int Fail(string message)
{
    Console.Error.WriteLine(message);
    Console.Error.WriteLine("Transfer: dotnet GipeDev.DataTransfer.dll [--source CONNECTION] [--destination PATH] [--replace]");
    Console.Error.WriteLine("Reset: dotnet GipeDev.DataTransfer.dll --clear-asteroids [--destination PATH] --confirm-clear");
    return 2;
}

static void DeleteIfExists(string path)
{
    if (File.Exists(path))
    {
        File.Delete(path);
    }
}
