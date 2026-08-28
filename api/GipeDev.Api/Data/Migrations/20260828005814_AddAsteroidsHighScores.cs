using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GipeDev.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAsteroidsHighScores : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "asteroids_pilots",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    NormalizedName = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_asteroids_pilots", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "asteroids_scores",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PilotId = table.Column<Guid>(type: "uuid", nullable: false),
                    Score = table.Column<int>(type: "integer", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "asteroids_scores");

            migrationBuilder.DropTable(
                name: "asteroids_pilots");
        }
    }
}
