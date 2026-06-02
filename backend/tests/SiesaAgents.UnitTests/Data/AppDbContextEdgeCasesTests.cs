using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;
using Xunit;

namespace SiesaAgents.UnitTests.Data;

/// <summary>
/// Edge-case / negative-path unit tests for <see cref="AppDbContext"/>.
///
/// Story 1.3 AC #4, #5, #6 — extends the baseline ATDD suite
/// (<see cref="AppDbContextTests"/>) with constructor-guard, multiple-context,
/// and model-stability checks that protect future Epic 2 / Epic 3 work.
///
/// Priority: P2 — Medium (regression net for DbContext shape & wiring).
/// </summary>
public class AppDbContextEdgeCasesTests
{
    // -------------------------------------------------------------------------
    // [P2] Constructor contract — null guard (AC #6)
    // -------------------------------------------------------------------------

    [Fact]
    public void AppDbContext_Constructor_ThrowsArgumentNullException_WhenOptionsAreNull()
    {
        // GIVEN: a null DbContextOptions reference
        DbContextOptions<AppDbContext>? options = null;

        // WHEN / THEN: instantiating with null options must throw — EF Core's base
        //              DbContext constructor enforces this. Documenting it here
        //              guards against accidental nullability regressions when
        //              <Nullable>enable</Nullable> is relaxed.
        Assert.Throws<ArgumentNullException>(() => new AppDbContext(options!));
    }

    // -------------------------------------------------------------------------
    // [P2] Multiple-instance & disposal contract (AC #6)
    // -------------------------------------------------------------------------

    [Fact]
    public void AppDbContext_CanBeConstructedMultipleTimes_WithIndependentInMemoryDatabases()
    {
        // GIVEN: two independent InMemory configurations with distinct database names
        var optionsA = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"MultiContextA_{Guid.NewGuid():N}")
            .Options;
        var optionsB = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"MultiContextB_{Guid.NewGuid():N}")
            .Options;

        // WHEN: we instantiate both
        using var contextA = new AppDbContext(optionsA);
        using var contextB = new AppDbContext(optionsB);

        // THEN: both are independently materialized DbContexts — required for the
        //       scoped DI lifecycle that AddDbContext<AppDbContext>() registers.
        //       (Note: EF Core caches IModel by context type + provider — both
        //        contexts may share the same Model reference, which is by design
        //        and is a perf optimization. We only assert the contexts themselves
        //        are distinct instances; sharing the model is expected.)
        Assert.NotSame(contextA, contextB);
        // Sanity: each context exposes a non-null materialized model.
        Assert.NotNull(contextA.Model);
        Assert.NotNull(contextB.Model);
    }

    [Fact]
    public void AppDbContext_IsDisposable_AndSafeToDisposeTwice()
    {
        // GIVEN: an AppDbContext instance
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"DisposalTest_{Guid.NewGuid():N}")
            .Options;
        var context = new AppDbContext(options);

        // WHEN: we dispose it twice (mirrors what the DI container may do during shutdown
        //       under certain test-host teardown paths)
        context.Dispose();
        var exception = Record.Exception(() => context.Dispose());

        // THEN: second dispose is a no-op — EF Core's DbContext is documented as
        //       safe to dispose multiple times. This guards against regressions where
        //       a derived class adds finalization that breaks idempotent disposal.
        Assert.Null(exception);
    }

    // -------------------------------------------------------------------------
    // [P2] OnModelCreating stability (AC #4)
    // -------------------------------------------------------------------------

    [Fact]
    public void AppDbContext_Model_IsStable_AcrossRepeatedAccess()
    {
        // GIVEN: a single AppDbContext instance
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"ModelStability_{Guid.NewGuid():N}")
            .Options;
        using var context = new AppDbContext(options);

        // WHEN: we access the Model property twice
        var modelFirst = context.Model;
        var modelSecond = context.Model;

        // THEN: EF Core caches the materialized model — both accesses return the SAME
        //       reference. This protects against accidental re-materialization that
        //       would run ApplySnakeCaseNaming twice (currently idempotent, but the
        //       caching contract is what guarantees no perf regression).
        Assert.Same(modelFirst, modelSecond);
    }

    [Fact]
    public void AppDbContext_ProviderName_IsInMemory_WhenConfiguredWithInMemory()
    {
        // GIVEN: an AppDbContext configured with the InMemory provider
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"ProviderCheck_{Guid.NewGuid():N}")
            .Options;
        using var context = new AppDbContext(options);

        // WHEN: we read the configured provider name
        var providerName = context.Database.ProviderName;

        // THEN: the provider name is the EF Core InMemory provider — proving that
        //       AppDbContext does NOT hardcode UseNpgsql in its OnConfiguring.
        //       (Provider wiring is the responsibility of Program.cs / AddDbContext.)
        Assert.Equal("Microsoft.EntityFrameworkCore.InMemory", providerName);
    }

    // -------------------------------------------------------------------------
    // [P2] Scope-note enforcement (AC #1, #2) — no domain DbSet<T>
    // -------------------------------------------------------------------------

    [Fact]
    public void AppDbContext_HasNoPublicDbSetProperties_PerStory13ScopeNote()
    {
        // GIVEN: the AppDbContext type
        var type = typeof(AppDbContext);

        // WHEN: we enumerate its public instance properties that are DbSet<T>
        var dbSetProperties = type
            .GetProperties(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance)
            .Where(p => p.PropertyType.IsGenericType
                && p.PropertyType.GetGenericTypeDefinition() == typeof(DbSet<>))
            .ToList();

        // THEN: there are zero DbSet<T> properties — Story 1.3 explicitly defers
        //       clientes (Epic 2 Story 2.1) and contactos (Epic 3 Story 3.1).
        //       Adding any DbSet<T> here is a scope-creep regression.
        Assert.Empty(dbSetProperties);
    }
}
