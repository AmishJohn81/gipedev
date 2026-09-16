using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GipeDev.Api.Data.SqliteMigrations
{
    /// <inheritdoc />
    public partial class InitialSqlite : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            if (ActiveProvider != "Microsoft.EntityFrameworkCore.Sqlite")
            {
                return;
            }

            migrationBuilder.CreateTable(
                name: "asteroids_pilots",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    NormalizedName = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_asteroids_pilots", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "contact_submissions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "TEXT", maxLength: 254, nullable: false),
                    Subject = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    Message = table.Column<string>(type: "TEXT", maxLength: 5000, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contact_submissions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "asteroids_scores",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    PilotId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Score = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_asteroids_scores", x => x.Id);
                    table.ForeignKey(
                        name: "FK_asteroids_scores_asteroids_pilots_PilotId",
                        column: x => x.PilotId,
                        principalTable: "asteroids_pilots",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_asteroids_pilots_NormalizedName",
                table: "asteroids_pilots",
                column: "NormalizedName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_asteroids_scores_CreatedAtUtc",
                table: "asteroids_scores",
                column: "CreatedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_asteroids_scores_PilotId",
                table: "asteroids_scores",
                column: "PilotId");

            migrationBuilder.CreateIndex(
                name: "IX_asteroids_scores_Score",
                table: "asteroids_scores",
                column: "Score");

            migrationBuilder.CreateIndex(
                name: "IX_contact_submissions_CreatedAtUtc",
                table: "contact_submissions",
                column: "CreatedAtUtc");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            if (ActiveProvider != "Microsoft.EntityFrameworkCore.Sqlite")
            {
                return;
            }

            migrationBuilder.DropTable(
                name: "asteroids_scores");

            migrationBuilder.DropTable(
                name: "contact_submissions");

            migrationBuilder.DropTable(
                name: "asteroids_pilots");
        }
    }
}
