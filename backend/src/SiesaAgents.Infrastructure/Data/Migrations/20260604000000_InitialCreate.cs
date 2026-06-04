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
            // Empty — no domain tables in this story.
            // Domain tables (clientes, contactos) are added in Epic 2 and Epic 3 respectively.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Empty
        }
    }
}
