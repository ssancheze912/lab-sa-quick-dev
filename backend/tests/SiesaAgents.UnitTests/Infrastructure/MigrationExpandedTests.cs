using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Story 1.3 — Expanded coverage for the InitialCreate migration beyond
/// <see cref="MigrationTests"/>. Focus: Down() emptiness, absence of any
/// DropTable / DropColumn operations, and defensive checks on the
/// generated model snapshot.
///
/// All assertions are metadata-only (no PostgreSQL connection required).
/// </summary>
public sealed class MigrationExpandedTests
{
    private static AppDbContext CreateContext() =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=localhost;Database=x;Username=x;Password=x")
            .UseSnakeCaseNamingConvention()
            .Options);

    // ─────────────────────────────────────────────────────────────────────
    // [P1] The InitialCreate Down() method must be a mirror of Up(): if Up()
    // is empty, Down() MUST be empty too. A rogue DropTable/DropColumn op
    // would attempt to drop tables that were never created — corrupting
    // any downstream rollback.
    // ─────────────────────────────────────────────────────────────────────

    private static string GetInitialCreateKey(AppDbContext ctx) =>
        ctx.Database.GetMigrations().Single(m => m.EndsWith("_InitialCreate"));

    [Fact]
    public void InitialCreate_Down_HasZero_DropTableOperations()
    {
        using var ctx = CreateContext();

        var migrationsAssembly = ctx.GetService<IMigrationsAssembly>();
        var initialCreateKey = GetInitialCreateKey(ctx);
        var initialCreate = migrationsAssembly.CreateMigration(
            migrationsAssembly.Migrations[initialCreateKey],
            activeProvider: "Npgsql.EntityFrameworkCore.PostgreSQL");

        var dropTableOps = initialCreate.DownOperations
            .OfType<DropTableOperation>()
            .ToArray();

        Assert.Empty(dropTableOps);
    }

    [Fact]
    public void InitialCreate_Down_HasZero_DropColumnOperations()
    {
        using var ctx = CreateContext();

        var migrationsAssembly = ctx.GetService<IMigrationsAssembly>();
        var initialCreateKey = GetInitialCreateKey(ctx);
        var initialCreate = migrationsAssembly.CreateMigration(
            migrationsAssembly.Migrations[initialCreateKey],
            activeProvider: "Npgsql.EntityFrameworkCore.PostgreSQL");

        var dropColumnOps = initialCreate.DownOperations
            .OfType<DropColumnOperation>()
            .ToArray();

        Assert.Empty(dropColumnOps);
    }

    // ─────────────────────────────────────────────────────────────────────
    // [P1] InitialCreate Up() defence in depth — zero AddColumn, zero
    // AddForeignKey, zero CreateIndex on the InitialCreate migration
    // specifically. Post-2.1, a *separate* AddClientesTable migration was
    // added; that migration DOES contain a CreateIndex — it is intentional
    // and NOT covered by these tests (they scope to InitialCreate only).
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public void InitialCreate_Up_HasZero_AddColumnOperations()
    {
        using var ctx = CreateContext();

        var migrationsAssembly = ctx.GetService<IMigrationsAssembly>();
        var initialCreateKey = GetInitialCreateKey(ctx);
        var initialCreate = migrationsAssembly.CreateMigration(
            migrationsAssembly.Migrations[initialCreateKey],
            activeProvider: "Npgsql.EntityFrameworkCore.PostgreSQL");

        var addColumnOps = initialCreate.UpOperations
            .OfType<AddColumnOperation>()
            .ToArray();

        Assert.Empty(addColumnOps);
    }

    [Fact]
    public void InitialCreate_Up_HasZero_CreateIndexOperations()
    {
        using var ctx = CreateContext();

        var migrationsAssembly = ctx.GetService<IMigrationsAssembly>();
        var initialCreateKey = GetInitialCreateKey(ctx);
        var initialCreate = migrationsAssembly.CreateMigration(
            migrationsAssembly.Migrations[initialCreateKey],
            activeProvider: "Npgsql.EntityFrameworkCore.PostgreSQL");

        var createIndexOps = initialCreate.UpOperations
            .OfType<CreateIndexOperation>()
            .ToArray();

        Assert.Empty(createIndexOps);
    }

    [Fact]
    public void InitialCreate_Up_HasZero_AddForeignKeyOperations()
    {
        using var ctx = CreateContext();

        var migrationsAssembly = ctx.GetService<IMigrationsAssembly>();
        var initialCreateKey = GetInitialCreateKey(ctx);
        var initialCreate = migrationsAssembly.CreateMigration(
            migrationsAssembly.Migrations[initialCreateKey],
            activeProvider: "Npgsql.EntityFrameworkCore.PostgreSQL");

        var addForeignKeyOps = initialCreate.UpOperations
            .OfType<AddForeignKeyOperation>()
            .ToArray();

        Assert.Empty(addForeignKeyOps);
    }

    // ─────────────────────────────────────────────────────────────────────
    // [P2] Migration id shape — 14-digit timestamp + "_InitialCreate".
    // Guards against manual renaming of the migration file that would
    // fracture the migration history table.
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public void InitialCreate_MigrationId_HasValidTimestampPrefix()
    {
        using var ctx = CreateContext();

        var migrationId = GetInitialCreateKey(ctx);

        // Format: YYYYMMDDHHmmss_InitialCreate
        Assert.Matches(@"^\d{14}_InitialCreate$", migrationId);
    }

    // ─────────────────────────────────────────────────────────────────────
    // [P2] Migrations are unique — no accidental duplicates. Post-2.1 the
    // assembly holds at least InitialCreate + AddClientesTable; both must
    // appear exactly once.
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public void MigrationsAssembly_ContainsUniqueMigrations_NoAccidentalDuplicates()
    {
        using var ctx = CreateContext();

        var migrationsAssembly = ctx.GetService<IMigrationsAssembly>();
        var keys = migrationsAssembly.Migrations.Keys.ToArray();

        Assert.Equal(keys.Length, keys.Distinct().Count());
        Assert.Contains(keys, k => k.EndsWith("_InitialCreate"));
    }
}
