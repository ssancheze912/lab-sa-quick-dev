using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SiesaAgents.Infrastructure.Migrations;

/// <inheritdoc />
public partial class InitialCreate : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Intentionally empty.
        // Story 1.3 ships ONLY the database scaffolding (creates __ef_migrations_history with
        // snake_case columns via EFCore.NamingConventions). Domain tables arrive in:
        //   - Story 2.1 → clientes
        //   - Story 3.1 → contactos
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Intentionally empty — mirrors Up().
    }
}
