// -----------------------------------------------------------------------------
//  Story 1.3 — Backend Database Foundation
//  BMad-Integrated testarch-automate — scope-note enforcement at the MODEL
//  level (AC #5). The ATDD baseline enforces this via the migration SQL, which
//  requires Docker. This unit test provides an equivalent guard that runs in
//  the Docker-less sandbox: if a future PR accidentally adds a DbSet<T> to
//  AppDbContext, these tests break BEFORE the migration is even generated.
//
//  Also validates that the AppDbContext.OnModelCreating pipeline (which now
//  includes ApplySnakeCaseNaming as its last statement per AC #4) can be
//  invoked end-to-end without throwing when zero domain entities are defined.
// -----------------------------------------------------------------------------
using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

public class AppDbContextModelTests
{
    private static DbContextOptions<AppDbContext> InMemoryOptions(string dbName) =>
        new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

    [Fact]
    public void GivenAppDbContextInStory13State_WhenOnModelCreatingRuns_ThenNoDomainEntitiesAreRegistered()
    {
        // GIVEN: the AppDbContext as it exists at the end of Story 1.3.
        //        The epic explicitly forbids ClienteEntity / ContactoEntity in
        //        this story (AC #5). Any PR that adds a DbSet must be rejected.
        using var ctx = new AppDbContext(InMemoryOptions(nameof(GivenAppDbContextInStory13State_WhenOnModelCreatingRuns_ThenNoDomainEntitiesAreRegistered)));

        // WHEN: the model is materialized (triggers OnModelCreating).
        var entityTypes = ctx.Model.GetEntityTypes().ToList();

        // THEN: zero domain entities are mapped. This IS the compile-time /
        //       runtime guard for the "no domain DbSets in Story 1.3" rule.
        //       When Epic 2 lands, this test becomes:
        //         Assert.Contains(entityTypes, e => e.ClrType.Name == "ClienteEntity");
        //       and this specific assertion (Empty) is updated then.
        Assert.Empty(entityTypes);
    }

    [Fact]
    public void GivenAppDbContextInStory13State_WhenOnModelCreatingRuns_ThenClienteEntityMustNotBeRegistered()
    {
        // GIVEN: the current story's AppDbContext.
        using var ctx = new AppDbContext(InMemoryOptions(nameof(GivenAppDbContextInStory13State_WhenOnModelCreatingRuns_ThenClienteEntityMustNotBeRegistered)));

        // WHEN: we scan the model by CLR-type name.
        var typeNames = ctx.Model.GetEntityTypes().Select(e => e.ClrType.Name).ToList();

        // THEN: neither of the two forbidden entities is present. AC #5 tells
        //       code review to reject any PR that reintroduces these.
        Assert.DoesNotContain("ClienteEntity", typeNames);
        Assert.DoesNotContain("ContactoEntity", typeNames);
    }

    [Fact]
    public void GivenAppDbContext_WhenConstructedWithInMemoryProvider_ThenOnModelCreatingCompletesWithoutThrowing()
    {
        // GIVEN: the InMemory provider (works without Npgsql / PostgreSQL —
        //        important for the Docker-less sandbox and for CI shards that
        //        do not need real infrastructure).

        // WHEN: constructing the context and forcing model materialization.
        // THEN: no exception — the ApplySnakeCaseNaming call over an empty
        //       entity graph is safe (regression guard for the "empty model"
        //       path of the extension).
        var exception = Record.Exception(() =>
        {
            using var ctx = new AppDbContext(InMemoryOptions(nameof(GivenAppDbContext_WhenConstructedWithInMemoryProvider_ThenOnModelCreatingCompletesWithoutThrowing)));
            _ = ctx.Model.GetEntityTypes().ToList();
        });

        Assert.Null(exception);
    }

    [Fact]
    public void GivenAppDbContext_WhenInspected_ThenItInheritsFromDbContext()
    {
        // GIVEN / WHEN / THEN: AppDbContext MUST be a DbContext subclass so
        //        that Program.cs can register it via AddDbContext<AppDbContext>.
        //        This is the primary type-shape invariant of Story 1.3.
        Assert.True(typeof(DbContext).IsAssignableFrom(typeof(AppDbContext)));
    }

    [Fact]
    public void GivenAppDbContextType_WhenReflected_ThenItExposesNoDbSetProperties()
    {
        // GIVEN: AppDbContext.
        var dbSetProperties = typeof(AppDbContext)
            .GetProperties(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance)
            .Where(p => p.PropertyType.IsGenericType
                        && p.PropertyType.GetGenericTypeDefinition() == typeof(DbSet<>))
            .ToList();

        // WHEN / THEN: no DbSet<T> properties should be visible on the type
        //              itself. AC #5 scope-note guard — the strongest static
        //              check we can run without Docker. Any devsub-agent that
        //              adds a `public DbSet<XEntity> Xs { get; set; }` in
        //              Story 1.3 will break THIS test before it even reaches
        //              the migration.
        Assert.Empty(dbSetProperties);
    }
}
