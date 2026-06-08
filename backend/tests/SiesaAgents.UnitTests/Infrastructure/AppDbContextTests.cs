// Story 1.3: Backend Database Foundation
// Epic 1: Project Foundation & Application Shell
//
// ATDD Acceptance Tests — RED Phase (Model Level — no real DB needed)
// These tests are intentionally FAILING until AppDbContext is implemented.
//
// Acceptance Criteria covered:
//   AC #2 — AppDbContext lives at src/SiesaAgents.Infrastructure/Data/AppDbContext.cs
//   AC #4 — modelBuilder.ApplySnakeCaseNaming() does not throw when applied to the empty model
//   AC #5 — AppDbContext can be constructed via DbContextOptions<AppDbContext> (DI shape)
//
// Test Design references:
//   TC-E1-P2-04 — snake_case verification at the EF model level
//
// Strategy: Build a context with UseNpgsql() but never open the connection. Only the
// model graph (in-memory) is exercised — this validates OnModelCreating runs cleanly
// and that no DbSets are declared in this story (Stories 2.1 / 3.1 will add entities).

using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

public class AppDbContextTests
{
    private const string FakeConnectionString =
        "Host=localhost;Database=siesa_agents_unit_test;Username=u;Password=p";

    private static AppDbContext BuildContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(FakeConnectionString)
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public void AppDbContext_WhenConstructedWithOptions_DoesNotThrow()
    {
        // GIVEN: A DbContextOptions<AppDbContext> with the Npgsql provider configured
        // WHEN: AppDbContext is instantiated (mirrors DI registration shape from AC #5)
        var ex = Record.Exception(() =>
        {
            using var context = BuildContext();
        });

        // THEN: No exception is thrown — the primary-constructor signature compiles + binds
        Assert.Null(ex);
    }

    [Fact]
    public void AppDbContext_Model_DeclaresClienteEntity_AfterStory2_1()
    {
        // GIVEN: A fresh AppDbContext (Story 2.1 added DbSet<ClienteEntity>)
        using var context = BuildContext();

        // WHEN: The EF Core model graph is materialized
        var entityTypes = context.Model.GetEntityTypes().ToList();

        // THEN: ClienteEntity is registered (Story 3.1 will add ContactoEntity)
        Assert.Single(entityTypes);
        Assert.Equal("ClienteEntity", entityTypes[0].ClrType.Name);
    }

    [Fact]
    public void OnModelCreating_AppliesSnakeCaseNaming_WithoutThrowingOnEmptyModel()
    {
        // GIVEN: A fresh AppDbContext
        using var context = BuildContext();

        // WHEN: Materializing the model triggers OnModelCreating, which calls
        //       modelBuilder.ApplySnakeCaseNaming() as its LAST instruction (AC #4)
        var ex = Record.Exception(() => _ = context.Model.GetEntityTypes());

        // THEN: ApplySnakeCaseNaming is safe to call on an empty model (no entity rewrites needed)
        Assert.Null(ex);
    }
}
