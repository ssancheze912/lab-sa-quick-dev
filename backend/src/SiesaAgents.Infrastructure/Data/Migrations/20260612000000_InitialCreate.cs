using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SiesaAgents.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Intentionally empty — Story 1.3 creates only the migrations infrastructure.
            // No domain tables (clientes, contactos) are created in this story.
            // ClienteEntity is created in Epic 2, Story 2.1.
            // ContactoEntity is created in Epic 3, Story 3.1.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Intentionally empty — no tables to drop.
        }
    }
}
