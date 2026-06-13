using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SiesaAgents.Infrastructure.Data.Migrations;

/// <inheritdoc />
public partial class InitialCreate : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Initial schema scaffold — no domain tables defined.
        // Domain tables will be added in Epic 2 and Epic 3 stories.
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // No domain tables to drop.
    }
}
