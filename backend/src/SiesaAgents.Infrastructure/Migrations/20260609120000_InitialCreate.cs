using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SiesaAgents.Infrastructure.Migrations;

/// <inheritdoc />
/// <summary>
/// Story 1.3 — Initial migration for the SiesaAgents PostgreSQL database.
///
/// INTENTIONALLY EMPTY: the only artefact produced by applying this migration is
/// the <c>__ef_migrations_history</c> housekeeping table (managed by EF Core itself),
/// which proves the EF pipeline + Npgsql + snake_case convention are wired correctly.
///
/// Domain tables (clientes, contactos, ...) are introduced by later epics:
///   * Epic 2 Story 2.1 → AddClientesTable
///   * Epic 3 Story 3.1 → AddContactosTable
/// </summary>
public partial class InitialCreate : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
    }
}
