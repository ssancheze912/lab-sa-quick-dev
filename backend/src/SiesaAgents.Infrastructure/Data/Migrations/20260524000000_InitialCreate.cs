using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SiesaAgents.Infrastructure.Data.Migrations;

/// <inheritdoc />
public partial class InitialCreate : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Empty initial migration — no domain tables defined yet.
        // ClienteEntity and ContactoEntity are added in Epic 2 and Epic 3 respectively.
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Nothing to roll back — schema is empty.
    }
}
