using Microsoft.EntityFrameworkCore;

namespace GipeDev.Api.Data;

public static class DatabaseProviderFactory
{
    public static IServiceCollection AddDatabaseProvider(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("GipeDev")
            ?? throw new InvalidOperationException(
                "ConnectionStrings:GipeDev is required.");

        switch ((configuration["DatabaseProvider"] ?? "Sqlite").ToUpperInvariant())
        {
            case "SQLITE":
                services.AddDbContext<SqliteGipeDevDbContext>(options =>
                    options.UseSqlite(connectionString, sqlite => sqlite.CommandTimeout(30)));
                services.AddScoped<GipeDevDbContext>(provider =>
                    provider.GetRequiredService<SqliteGipeDevDbContext>());
                return services;
            case "POSTGRESQL":
            case "POSTGRES":
                services.AddDbContext<PostgresGipeDevDbContext>(options =>
                    options.UseNpgsql(connectionString));
                services.AddScoped<GipeDevDbContext>(provider =>
                    provider.GetRequiredService<PostgresGipeDevDbContext>());
                return services;
            default:
                throw new InvalidOperationException(
                    "DatabaseProvider must be either 'Sqlite' or 'PostgreSql'.");
        }
    }
}
