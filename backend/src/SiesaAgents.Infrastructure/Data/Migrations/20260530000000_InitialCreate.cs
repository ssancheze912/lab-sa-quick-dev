using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SiesaAgents.Infrastructure.Data.Migrations;

/// <inheritdoc />
public partial class InitialCreate : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Initial empty migration — no domain tables in Story 1.3.
        // ClienteEntity (clientes table) is added in Epic 2 Story 2.1.
        // ContactoEntity (contactos table) is added in Epic 3 Story 3.1.
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // No tables to drop — migration is intentionally empty.
    }
}
