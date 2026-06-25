using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SiesaAgents.Infrastructure.Data.Migrations;

/// <inheritdoc />
public partial class InitialCreate : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Initial migration: no domain tables yet.
        // Domain entities (ClienteEntity, ContactoEntity) will be added in Epic 2 and Epic 3.
        // Only the __EFMigrationsHistory table is created by EF Core infrastructure.
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Nothing to revert — no domain tables were created in this migration.
    }
}
