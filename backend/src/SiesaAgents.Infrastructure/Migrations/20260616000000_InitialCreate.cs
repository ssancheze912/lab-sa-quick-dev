using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SiesaAgents.Infrastructure.Migrations;

/// <inheritdoc />
public partial class InitialCreate : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Intentionally empty — no entities defined in Story 1.3.
        // ClienteEntity tables are created in Epic 2 Story 2.1.
        // ContactoEntity tables are created in Epic 3 Story 3.1.
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Intentionally empty — mirrors empty Up method.
    }
}
