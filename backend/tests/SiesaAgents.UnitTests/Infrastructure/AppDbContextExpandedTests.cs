using System.Reflection;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Story 1.3 — Expanded coverage beyond the ATDD baseline in
/// <see cref="AppDbContextTests"/>. Focus: DI lifetime semantics,
/// scope-note enforcement (no DbSets), and the snake_case option plugin
/// being present in the resolved <see cref="IDbContextOptions"/>.
///
/// These tests are pure metadata inspection — no PostgreSQL connection is
/// opened at any point.
/// </summary>
public sealed class AppDbContextExpandedTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public AppDbContextExpandedTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    // ─────────────────────────────────────────────────────────────────────
    // [P1] DI lifetime — AddDbContext<T> registers as Scoped by default.
    // A Singleton or Transient DbContext would break EF's change-tracker
    // semantics and cause hard-to-debug data leaks across requests.
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_IsRegistered_WithScopedLifetime()
    {
        // GIVEN: The application is booted through WebApplicationFactory.
        // WHEN:  Two scopes each resolve AppDbContext.
        using var scopeA = _factory.Services.CreateScope();
        using var scopeB = _factory.Services.CreateScope();

        var ctxA = scopeA.ServiceProvider.GetRequiredService<AppDbContext>();
        var ctxB = scopeB.ServiceProvider.GetRequiredService<AppDbContext>();

        // THEN: Different scopes yield DIFFERENT instances (Scoped behaviour).
        Assert.NotSame(ctxA, ctxB);
    }

    [Fact]
    public void AppDbContext_SameScope_ReturnsSameInstance()
    {
        // GIVEN: A single DI scope.
        using var scope = _factory.Services.CreateScope();

        // WHEN: Resolving AppDbContext twice within the same scope.
        var ctx1 = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var ctx2 = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // THEN: Both resolutions return the SAME instance (Scoped semantics).
        Assert.Same(ctx1, ctx2);
    }

    // ─────────────────────────────────────────────────────────────────────
    // [P1] Scope enforcement — Story 1.3 explicitly forbids DbSet<>.
    // A DbSet declared by mistake would silently enable Epic 2/3 entities
    // to leak into the migration snapshot.
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_ExposesClientesDbSet_ByDesign()
    {
        // GIVEN: The AppDbContext type after Story 2.1 introduced the first
        // domain DbSet<> (Clientes). Story 1.3 originally asserted zero
        // DbSets; the invariant was scoped to Epic 1 only — Story 2.1
        // legitimately adds the ClienteEntity DbSet as part of the vertical
        // slice.
        var dbContextType = typeof(AppDbContext);

        // WHEN: Reflecting over public instance properties.
        var dbSetProperties = dbContextType
            .GetProperties(BindingFlags.Public | BindingFlags.Instance)
            .Where(p => p.PropertyType.IsGenericType &&
                        p.PropertyType.GetGenericTypeDefinition() == typeof(DbSet<>))
            .ToArray();

        // THEN: Exactly one DbSet<>, and it is Clientes.
        var clientes = Assert.Single(dbSetProperties);
        Assert.Equal("Clientes", clientes.Name);
    }

    // ─────────────────────────────────────────────────────────────────────
    // [P2] Snake_case plugin registration — the plugin extension MUST be
    // discoverable on the resolved IDbContextOptions. Verifies that the
    // options-level rewrite (from Program.cs UseSnakeCaseNamingConvention())
    // survives DI resolution — the true carrier of snake_case behaviour.
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContextOptions_ContainsSnakeCaseNamingPlugin()
    {
        // GIVEN: A scope resolves AppDbContext.
        using var scope = _factory.Services.CreateScope();
        var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // WHEN: Inspect the IDbContextOptions the context was constructed with.
        var options = ((IInfrastructure<IServiceProvider>)ctx)
            .Instance
            .GetService<IDbContextOptions>();
        Assert.NotNull(options);

        // THEN: At least one options extension type-name contains "Naming"
        // (EFCore.NamingConventions' extension is named
        // NpgsqlSnakeCaseNamingConventionsOptionsExtension or similar; the
        // exact class name varies by provider, so we match by substring).
        var extensionTypeNames = options!.Extensions
            .Select(e => e.GetType().Name)
            .ToArray();

        Assert.Contains(
            extensionTypeNames,
            n => n.IndexOf("Naming", StringComparison.OrdinalIgnoreCase) >= 0);
    }

    // ─────────────────────────────────────────────────────────────────────
    // [P2] Provider name — Npgsql is the only accepted PostgreSQL provider.
    // Guards against accidental swap to InMemory / SQLite in a future refactor.
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_ProviderName_IsExactlyNpgsql_NoLegacyOrInMemory()
    {
        using var scope = _factory.Services.CreateScope();
        var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var providerName = ctx.Database.ProviderName ?? string.Empty;

        Assert.Equal("Npgsql.EntityFrameworkCore.PostgreSQL", providerName);

        // Defensive: nobody should ever have accidentally registered InMemory
        // or Sqlite alongside the real provider.
        Assert.DoesNotContain("InMemory", providerName, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("Sqlite", providerName, StringComparison.OrdinalIgnoreCase);
    }

    // ─────────────────────────────────────────────────────────────────────
    // [P2] Model finalization — call Model twice, verify determinism.
    // If OnModelCreating had non-idempotent side-effects (e.g. a static
    // registration), the second build would diverge.
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_ModelFinalization_IsDeterministic_AcrossMultipleReads()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=localhost;Database=x;Username=x;Password=x")
            .UseSnakeCaseNamingConvention()
            .Options;

        using var ctx1 = new AppDbContext(options);
        using var ctx2 = new AppDbContext(options);

        var entityCount1 = ctx1.Model.GetEntityTypes().Count();
        var entityCount2 = ctx2.Model.GetEntityTypes().Count();

        Assert.Equal(entityCount1, entityCount2);
        // Story 2.1 added ClienteEntity — the model now has at least one
        // user-defined entity. Determinism is what we care about (both reads
        // yield the same count), NOT a fixed count.
        Assert.True(entityCount1 >= 1);
    }
}
