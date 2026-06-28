using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SiesaAgents.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class MakeContactoEmailUnique : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_contactos_email",
                table: "contactos");

            migrationBuilder.CreateIndex(
                name: "uk_contactos_email",
                table: "contactos",
                column: "email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "uk_contactos_email",
                table: "contactos");

            migrationBuilder.CreateIndex(
                name: "ix_contactos_email",
                table: "contactos",
                column: "email");
        }
    }
}
