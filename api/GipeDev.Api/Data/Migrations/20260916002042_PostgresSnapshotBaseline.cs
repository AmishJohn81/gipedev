using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GipeDev.Api.Data.Migrations;

/// <summary>
/// Establishes a provider-specific PostgreSQL snapshot without changing the
/// schema already created by the two preceding PostgreSQL migrations.
/// </summary>
public partial class PostgresSnapshotBaseline : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
    }
}
