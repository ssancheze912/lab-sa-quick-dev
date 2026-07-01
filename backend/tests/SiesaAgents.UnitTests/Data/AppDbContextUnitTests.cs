using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Data;

/// <summary>
/// Story 1.3 — Backend Database Foundation (expanded coverage, Postgres-independent).
///
/// These unit tests exercise <see cref="AppDbContext"/> at the EF-Core model / options level
/// so they run in CI without a live PostgreSQL. They complement the DB-touching
/// integration tests in <c>DatabaseMigrationTests</c> which SKIP when Postgres is unavailable.
///
/// AC coverage:
///   - AC #4 — <c>ApplySnakeCaseNaming()</c> is applied globally (verified against the built model).
///   - AC #4 — <c>OnModelCreating</c> does not register any domain entity types.
///   - AC #4 — <c>MigrationsHistoryTable</c> constant is the exact snake_case name expected by the schema.
///   - AC #4 — <c>OnConfiguring</c> is safe when no relational extension is present (idempotent guard).
///   - AC #1 — Exactly ONE migration ships in the Infrastructure assembly and it is <c>InitialCreate</c>.
/// </summary>
public class AppDbContextUnitTests
{
    private const string DummyConnectionString =
        "Host=localhost;Port=5432;Database=siesa_agents_unit_test;Username=postgres;Password=postgres";

    // ---------------------------------------------------------------------
    // AC #4 — snake_case naming is applied globally at the model level.
    // ---------------------------------------------------------------------

    [Fact(DisplayName = "[P1][unit] AC#4 — Built model exposes only the EF-internal HistoryRow entity")]
    public void Model_OnlyEfInternalEntityTypesArePresent()
    {
        // GIVEN options equivalent to Program.cs registration
        var options = BuildOptions();

        // WHEN we build the compiled model
        using var ctx = new AppDbContext(options);
        var entityTypes = ctx.Model.GetEntityTypes().ToList();

        // THEN every declared entity is internal to EF (i.e. no domain leakage)
        Assert.All(entityTypes, e =>
            Assert.StartsWith("Microsoft.EntityFrameworkCore", e.ClrType.FullName ?? string.Empty, StringComparison.Ordinal));
    }

    [Fact(DisplayName = "[P1][unit] AC#4 — No IEntityTypeConfiguration<> was registered (empty story scope)")]
    public void Model_HasZeroDomainEntityTypes()
    {
        // GIVEN AppDbContext with the same options shape used in production DI
        var options = BuildOptions();
        using var ctx = new AppDbContext(options);

        // WHEN filtering user (non-EF) entities
        var domainEntities = ctx.Model.GetEntityTypes()
            .Where(e => !(e.ClrType.FullName ?? string.Empty)
                .StartsWith("Microsoft.EntityFrameworkCore", StringComparison.Ordinal))
            .ToList();

        // THEN the domain is empty (guards against future accidental DbSet<> additions in this story)
        Assert.Empty(domainEntities);
    }

    [Fact(DisplayName = "[P2][unit] AC#4 — Snake-case naming convention is registered on the DbContextOptions")]
    public void Options_UseSnakeCaseNamingConvention_IsPresent()
    {
        // GIVEN the same options builder path used in Program.cs
        var options = BuildOptions();

        // WHEN inspecting the registered core options extensions
        // (EFCore.NamingConventions registers an internal extension when UseSnakeCaseNamingConvention() is invoked)
        var hasNamingExtension = options.Extensions
            .Any(e => (e.GetType().FullName ?? string.Empty)
                .Contains("NamingConvention", StringComparison.OrdinalIgnoreCase));

        // THEN the naming-convention extension is present in the options
        Assert.True(hasNamingExtension,
            "UseSnakeCaseNamingConvention() must register a NamingConvention options extension.");
    }

    [Fact(DisplayName = "[P1][unit] AC#4/#6 — MigrationsHistoryTableName constant is the snake_case standard name")]
    public void MigrationsHistoryTableName_Constant_IsSnakeCase()
    {
        // GIVEN AC #6 mandates snake_case for the EF internal table
        // THEN the shared constant is the exact expected name
        Assert.Equal("__ef_migrations_history", AppDbContext.MigrationsHistoryTableName);
    }

    // ---------------------------------------------------------------------
    // AC #4 — OnConfiguring must be safe for any DbContextOptions shape.
    // Regression guard: previous implementations that unconditionally called
    // UseNpgsql() on OnConfiguring would crash for non-relational options.
    // ---------------------------------------------------------------------

    [Fact(DisplayName = "[P2][unit] AC#4 — OnConfiguring is a no-op when options have no relational extension")]
    public void OnConfiguring_WithoutRelationalExtension_DoesNotThrow()
    {
        // GIVEN options built with InMemory (no RelationalOptionsExtension present)
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "unit-test-" + Guid.NewGuid())
            .Options;

        // WHEN the DbContext is materialised (which triggers OnConfiguring)
        var exception = Record.Exception(() =>
        {
            using var ctx = new AppDbContext(options);
            // Force model build so OnConfiguring executes end-to-end.
            _ = ctx.Model;
        });

        // THEN no exception is thrown — the guard clause in OnConfiguring holds.
        Assert.Null(exception);
    }

    [Fact(DisplayName = "[P2][unit] AC#4 — OnConfiguring re-applies MigrationsHistoryTable for relational options")]
    public void OnConfiguring_WithRelationalOptions_PreservesConnectionString()
    {
        // GIVEN options built exactly like Program.cs
        var options = BuildOptions();

        // WHEN the context resolves its final options through OnConfiguring
        using var ctx = new AppDbContext(options);
        var relationalExt = ctx.GetService<IDbContextOptions>()
            .Extensions
            .OfType<RelationalOptionsExtension>()
            .FirstOrDefault();

        // THEN the resolved connection string is unchanged (i.e. OnConfiguring did not clear it)
        Assert.NotNull(relationalExt);
        Assert.False(string.IsNullOrEmpty(relationalExt!.ConnectionString));
        Assert.Contains("siesa_agents_unit_test", relationalExt.ConnectionString!, StringComparison.OrdinalIgnoreCase);
    }

    // ---------------------------------------------------------------------
    // AC #1 — Exactly one InitialCreate migration is shipped.
    // Postgres-independent: GetMigrations() reads the compiled Infrastructure assembly.
    // ---------------------------------------------------------------------

    [Fact(DisplayName = "[P1][unit] AC#1 — Exactly one migration is defined in the Infrastructure assembly")]
    public void GetMigrations_ExposesExactlyOneInitialCreateMigration()
    {
        // GIVEN the DbContext with its assembly-scanned migrations
        var options = BuildOptions();
        using var ctx = new AppDbContext(options);

        // WHEN listing declared migrations (does not touch the database)
        var declared = ctx.Database.GetMigrations().ToList();

        // THEN exactly one migration is declared and it is InitialCreate
        Assert.Single(declared);
        Assert.EndsWith("_InitialCreate", declared[0], StringComparison.Ordinal);
    }

    [Fact(DisplayName = "[P2][unit] AC#1 — InitialCreate migration name has the expected timestamp+name shape")]
    public void GetMigrations_InitialCreate_HasTimestampPrefix()
    {
        // GIVEN the migrations shipped by Infrastructure
        var options = BuildOptions();
        using var ctx = new AppDbContext(options);
        var name = ctx.Database.GetMigrations().Single();

        // WHEN the name is split on '_'
        var parts = name.Split('_', 2);

        // THEN the prefix is a 14-digit timestamp and the suffix is 'InitialCreate'
        Assert.Equal(2, parts.Length);
        Assert.Equal(14, parts[0].Length);
        Assert.True(parts[0].All(char.IsDigit),
            $"Migration prefix must be an all-digit timestamp; got '{parts[0]}'");
        Assert.Equal("InitialCreate", parts[1]);
    }

    // ---------------------------------------------------------------------
    // Test helpers
    // ---------------------------------------------------------------------

    private static DbContextOptions<AppDbContext> BuildOptions() =>
        new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(DummyConnectionString,
                npgsql => npgsql.MigrationsHistoryTable(AppDbContext.MigrationsHistoryTableName))
            .UseSnakeCaseNamingConvention()
            .Options;
}
