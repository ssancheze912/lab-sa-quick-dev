using SiesaAgents.Infrastructure.Migrations;

namespace SiesaAgents.UnitTests.Infrastructure.Migrations;

/// <summary>
/// Story 1.3 AC #1 — expands ATDD coverage for the <c>InitialCreate</c> migration.
///
/// The ATDD integration tests (<c>AppDbContextMigrationTests</c>) verify "no domain tables"
/// by querying <c>information_schema.tables</c> against a real, locally running PostgreSQL
/// instance — and soft-skip (no assertion, no failure) when PostgreSQL is unreachable. That
/// means in any environment without a local database (e.g. a bare CI runner or this sandbox
/// between database restarts), AC #1's "empty migration" requirement is never actually
/// verified.
///
/// These unit tests close that gap by inspecting the migration's generated operations
/// directly (<see cref="Migration.UpOperations"/> / <see cref="Migration.DownOperations"/>,
/// both of which EF Core builds by invoking the migration's protected Up()/Down() methods
/// against an in-memory <c>MigrationBuilder</c>) — no database connection required, so the
/// assertion always runs regardless of local infrastructure availability.
/// </summary>
public class InitialCreateMigrationTests
{
    [Fact]
    public void Up_ProducesNoMigrationOperations()
    {
        // GIVEN the InitialCreate migration (no domain entities exist in this story)
        var migration = new InitialCreate();

        // WHEN the Up() operations are built
        var operations = migration.UpOperations;

        // THEN no operations are generated — no CreateTable, no domain schema changes
        Assert.Empty(operations);
    }

    [Fact]
    public void Down_ProducesNoMigrationOperations()
    {
        // GIVEN the InitialCreate migration (no domain entities exist in this story)
        var migration = new InitialCreate();

        // WHEN the Down() operations are built
        var operations = migration.DownOperations;

        // THEN no operations are generated — rollback is a no-op, matching the empty Up()
        Assert.Empty(operations);
    }
}
