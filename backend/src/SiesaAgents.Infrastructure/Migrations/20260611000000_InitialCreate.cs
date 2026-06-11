using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SiesaAgents.Infrastructure.Migrations;

/// <inheritdoc />
public partial class InitialCreate : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Empty initial migration — no domain entities in Story 1.3 scope.
        // Domain entities (ClienteEntity, ContactoEntity) will be added in Epics 2 and 3.
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // No operations to reverse for the empty baseline migration.
    }
}
