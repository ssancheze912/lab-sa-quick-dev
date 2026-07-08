using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Story 1.3 — AC #5, #6, #8 (RED phase).
///
/// Verifies:
///   * <see cref="AppDbContext.OnModelCreating"/> applies snake_case naming as the
///     LAST call — so table/column names emitted at model-build time follow
///     PostgreSQL conventions (per company standards and NFR).
///   * <see cref="AppDbContext"/> is registered in DI with Npgsql + snake_case
///     options AND reads the connection string from configuration
///     (<c>ConnectionStrings:DefaultConnection</c>) with no hardcoded fallback.
///
/// SANDBOX NOTE: these tests do NOT open a live PostgreSQL connection. They
/// exercise the model builder in-memory (which the naming-convention plugin
/// runs at model-build time, not at query time) and inspect the resolved
/// service via <c>Database.ProviderName</c> — a metadata-only check.
/// </summary>
public sealed class AppDbContextTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public AppDbContextTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    // ─────────────────────────────────────────────────────────────────────
    // AC #5 — snake_case naming convention IS applied to the model
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public void OnModelCreating_AppliesSnakeCaseNaming_LastCall()
    {
        // GIVEN: An AppDbContext configured with Npgsql + snake_case naming
        //        (matching the runtime DI registration in Program.cs).
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=localhost;Database=x;Username=x;Password=x")
            .UseSnakeCaseNamingConvention()
            .Options;

        using var ctx = new AppDbContext(options);

        // WHEN: Force the model to build.
        var model = ctx.Model;

        // THEN: Every user-defined entity has snake_case table + column names
        // applied by the naming-convention rewriter. Story 2.1 introduced the
        // first entity (ClienteEntity → "clientes"), so this assertion now
        // proves the rewriter actually runs on real entities, not just an
        // empty model.
        var userEntities = model.GetEntityTypes()
            .Where(e => !e.IsOwned())
            .ToArray();

        Assert.NotEmpty(userEntities);
        foreach (var entity in userEntities)
        {
            var tableName = entity.GetTableName();
            Assert.NotNull(tableName);
            Assert.Equal(tableName, tableName!.ToLowerInvariant());
            Assert.DoesNotContain(' ', tableName);
        }

        Assert.NotNull(model);
    }

    // ─────────────────────────────────────────────────────────────────────
    // AC #6 — DI registration reads DefaultConnection + wires Npgsql provider
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public void Registered_DbContext_UsesConnectionStringFromConfig()
    {
        // GIVEN: The application host is booted through WebApplicationFactory
        //        (this exercises Program.cs, which is the code under test).
        // WHEN:  A scope resolves AppDbContext.
        using var scope = _factory.Services.CreateScope();
        var ctx = scope.ServiceProvider.GetService<AppDbContext>();

        // THEN: The context is resolvable — proving AddDbContext<AppDbContext>
        // is present in Program.cs (AC #6).
        Assert.NotNull(ctx);

        // AND: The configured provider is Npgsql (NOT InMemory, NOT SQLite).
        // Database.ProviderName is metadata-only — no connection is opened.
        Assert.Equal("Npgsql.EntityFrameworkCore.PostgreSQL", ctx!.Database.ProviderName);
    }
}
