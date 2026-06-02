using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;
using Xunit;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// Regression guard for Story 1.3 AC #1 and AC #4 — the EF Core history table
/// MUST be named <c>__ef_migrations_history</c> with snake_case columns
/// (<c>migration_id</c> / <c>product_version</c>).
///
/// The history table is created OUTSIDE <see cref="Microsoft.EntityFrameworkCore.DbContext.OnModelCreating"/>
/// by <see cref="IHistoryRepository"/>, so <c>ApplySnakeCaseNaming()</c> alone
/// is insufficient. These tests catch any regression where
/// <see cref="SnakeCaseNpgsqlHistoryRepository"/> stops being registered or its
/// table name override is removed.
///
/// They run WITHOUT a live database — they inspect the generated CREATE TABLE
/// script produced by the configured <see cref="IHistoryRepository"/>.
/// </summary>
[Trait("Category", "Api")]
public class SnakeCaseHistoryRepositoryTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public SnakeCaseHistoryRepositoryTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(b => b.UseEnvironment("Development"));
    }

    [Fact]
    public void HistoryRepository_IsSnakeCaseNpgsqlHistoryRepository()
    {
        // GIVEN: the API host's DI container (already wired in Program.cs)
        using var scope = _factory.Services.CreateScope();
        var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // WHEN: we resolve the history repository EF Core uses for `dotnet ef database update`
        var historyRepo = ctx.GetService<IHistoryRepository>();

        // THEN: it MUST be our snake_case-aware override — protects AC #1 / AC #4.
        Assert.NotNull(historyRepo);
        Assert.IsType<SnakeCaseNpgsqlHistoryRepository>(historyRepo);
    }

    [Fact]
    public void HistoryRepository_CreateScript_UsesSnakeCaseTableAndColumnNames()
    {
        // GIVEN: the API host's DI container
        using var scope = _factory.Services.CreateScope();
        var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var historyRepo = ctx.GetService<IHistoryRepository>();

        // WHEN: we ask the history repository for its CREATE TABLE script
        //       (the exact statement `dotnet ef database update` runs on first use).
        var script = historyRepo.GetCreateScript();

        // THEN: the snake_case identifiers mandated by AC #1 + AC #4 are present,
        //       AND the legacy PascalCase identifiers are absent. This catches any
        //       regression that drops either the `MigrationsHistoryTable(...)`
        //       override or the `ReplaceService<IHistoryRepository, ...>` wiring.
        Assert.Contains("__ef_migrations_history", script);
        Assert.Contains("migration_id", script);
        Assert.Contains("product_version", script);

        Assert.DoesNotContain("__EFMigrationsHistory", script);
        Assert.DoesNotContain("\"MigrationId\"", script);
        Assert.DoesNotContain("\"ProductVersion\"", script);
    }
}
