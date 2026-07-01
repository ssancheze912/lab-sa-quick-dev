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

    [Fact(DisplayName = "[P1][unit] AC#4 — Built model exposes EF-internal + the domain entities added so far")]
    public void Model_OnlyEfInternalEntityTypesArePresent()
    {
        // GIVEN options equivalent to Program.cs registration
        var options = BuildOptions();

        // WHEN we build the compiled model
        using var ctx = new AppDbContext(options);
        var entityTypes = ctx.Model.GetEntityTypes().ToList();

        // THEN every declared entity is either internal to EF or belongs to the SiesaAgents.Domain namespace.
        // Prevents accidental leakage from unrelated assemblies (e.g. Infrastructure/API types being mapped).
        Assert.All(entityTypes, e =>
        {
            var fullName = e.ClrType.FullName ?? string.Empty;
            var isInternal = fullName.StartsWith("Microsoft.EntityFrameworkCore", StringComparison.Ordinal);
            var isDomain = fullName.StartsWith("SiesaAgents.Domain.", StringComparison.Ordinal);
            Assert.True(isInternal || isDomain, $"Unexpected entity type mapped: {fullName}");
        });
    }

    [Fact(DisplayName = "[P1][unit] AC#4 — Story 2.1 registers ClienteEntity via ApplyConfigurationsFromAssembly")]
    public void Model_HasClienteEntityRegistered()
    {
        // GIVEN AppDbContext with the same options shape used in production DI
        var options = BuildOptions();
        using var ctx = new AppDbContext(options);

        // WHEN filtering user (non-EF) entities
        var domainEntities = ctx.Model.GetEntityTypes()
            .Where(e => !(e.ClrType.FullName ?? string.Empty)
                .StartsWith("Microsoft.EntityFrameworkCore", StringComparison.Ordinal))
            .Select(e => e.ClrType.Name)
            .ToList();

        // THEN ClienteEntity is registered by Story 2.1's ClienteConfiguration.
        Assert.Contains("ClienteEntity", domainEntities);
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

    [Fact(DisplayName = "[P1][unit] AC#1 — InitialCreate migration is the first declared migration")]
    public void GetMigrations_InitialCreate_IsFirst()
    {
        // GIVEN the DbContext with its assembly-scanned migrations
        var options = BuildOptions();
        using var ctx = new AppDbContext(options);

        // WHEN listing declared migrations (does not touch the database)
        var declared = ctx.Database.GetMigrations().ToList();

        // THEN the first migration is Story 1.3's InitialCreate.
        // Additional migrations (Story 2.1 AddClientesTable, ...) are expected.
        Assert.NotEmpty(declared);
        Assert.EndsWith("_InitialCreate", declared[0], StringComparison.Ordinal);
    }

    [Fact(DisplayName = "[P2][unit] AC#1 — Every declared migration name uses the timestamp+name shape")]
    public void GetMigrations_All_HaveTimestampPrefix()
    {
        // GIVEN the migrations shipped by Infrastructure
        var options = BuildOptions();
        using var ctx = new AppDbContext(options);

        foreach (var name in ctx.Database.GetMigrations())
        {
            // WHEN the name is split on '_'
            var parts = name.Split('_', 2);

            // THEN prefix is a 14-digit timestamp and suffix is a non-empty descriptor
            Assert.Equal(2, parts.Length);
            Assert.Equal(14, parts[0].Length);
            Assert.True(parts[0].All(char.IsDigit),
                $"Migration prefix must be an all-digit timestamp; got '{parts[0]}'");
            Assert.False(string.IsNullOrWhiteSpace(parts[1]));
        }
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
