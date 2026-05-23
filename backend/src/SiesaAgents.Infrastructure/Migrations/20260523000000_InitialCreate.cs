using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SiesaAgents.Infrastructure.Data.Migrations;

/// <inheritdoc />
public partial class InitialCreate : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Empty baseline migration — no domain tables yet.
        // clientes table: added in Epic 2 Story 2.1
        // contactos table: added in Epic 3 Story 3.1
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // No tables to drop in the baseline migration.
    }
}
