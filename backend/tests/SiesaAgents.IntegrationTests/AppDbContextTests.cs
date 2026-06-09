using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// AC #5 / TC-E1-P1-05 + TC-E1-P2-04 — AppDbContext is registered and configured correctly.
///
/// Verifies:
///   * AppDbContext is resolvable from the API host DI container (AC #2).
///   * The registered provider is Npgsql (AC #2).
///   * Database.GetMigrations() returns at least one migration (AC #1, AC #7).
///   * The entity model contains zero entity types (story scope — AC #1, AC #7).
///   * OnModelCreating runs ApplySnakeCaseNaming() without throwing (AC #4).
///
/// EXPECTED RED-PHASE FAILURE REASONS (until Story 1.3 is implemented):
///   1. SiesaAgents.Infrastructure.Data.AppDbContext does not yet exist → compile error.
///   2. AddInfrastructure(...) extension does not yet exist → compile error.
///   3. Program.cs does not yet call builder.Services.AddInfrastructure(...) → DI resolution throws.
///   4. No InitialCreate migration is committed yet → Database.GetMigrations() returns empty.
///   5. ApplySnakeCaseNaming() extension does not yet exist → compile error in AppDbContext.
/// </summary>
public class AppDbContextTests
{
    /// <summary>
    /// GIVEN the API host is bootstrapped,
    /// WHEN AppDbContext is resolved from DI,
    /// THEN it is non-null (AddInfrastructure registered it).
    /// </summary>
    [Fact]
    public void AppDbContext_IsRegisteredInDi()
    {
        // GIVEN
        using var factory = new SiesaAgentsWebApplicationFactory();
        using var scope = factory.Services.CreateScope();

        // WHEN
        var ctx = scope.ServiceProvider.GetService<AppDbContext>();

        // THEN
        Assert.NotNull(ctx);
    }

    /// <summary>
    /// GIVEN AppDbContext is resolved,
    /// WHEN we inspect the database provider,
    /// THEN it is Npgsql.EntityFrameworkCore.PostgreSQL (AC #2 — UseNpgsql).
    /// </summary>
    [Fact]
    public void AppDbContext_UsesNpgsqlProvider()
    {
        // GIVEN
        using var factory = new SiesaAgentsWebApplicationFactory();
        using var scope = factory.Services.CreateScope();
        var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // WHEN
        var providerName = ctx.Database.ProviderName;

        // THEN
        Assert.Equal("Npgsql.EntityFrameworkCore.PostgreSQL", providerName);
    }

    /// <summary>
    /// GIVEN AppDbContext is resolved,
    /// WHEN we ask for the set of migrations defined in the assembly,
    /// THEN at least one migration is returned (the InitialCreate from AC #1).
    /// </summary>
    [Fact]
    public void AppDbContext_HasAtLeastOneMigration()
    {
        // GIVEN
        using var factory = new SiesaAgentsWebApplicationFactory();
        using var scope = factory.Services.CreateScope();
        var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // WHEN
        var migrations = ctx.Database.GetMigrations().ToList();

        // THEN
        Assert.NotEmpty(migrations);
    }

    /// <summary>
    /// GIVEN this is the Story 1.3 infrastructure-only scope (no domain entities yet),
    /// WHEN we inspect AppDbContext.Model.GetEntityTypes(),
    /// THEN the result is empty (no ClienteEntity, no ContactoEntity — AC #1, AC #7).
    ///
    /// This guards against entity leakage into the initial migration.
    /// </summary>
    [Fact]
    public void AppDbContext_Model_ContainsZeroEntityTypes()
    {
        // GIVEN
        using var factory = new SiesaAgentsWebApplicationFactory();
        using var scope = factory.Services.CreateScope();
        var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // WHEN
        var entityTypes = ctx.Model.GetEntityTypes().ToList();

        // THEN
        Assert.Empty(entityTypes);
    }

    /// <summary>
    /// AC #4 / TC-E1-P2-04 — ApplySnakeCaseNaming is wired into OnModelCreating.
    ///
    /// GIVEN a DbContextOptionsBuilder with UseNpgsql + UseSnakeCaseNamingConvention,
    /// WHEN we materialize AppDbContext.Model,
    /// THEN OnModelCreating completes without throwing (snake-case extension call resolved
    ///      and ran). The model materializes lazily without opening a connection.
    /// </summary>
    [Fact]
    public void OnModelCreating_AppliesSnakeCaseNamingWithoutThrowing()
    {
        // GIVEN
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=fake;Database=fake;Username=fake;Password=fake")
            .UseSnakeCaseNamingConvention();

        // WHEN
        using var ctx = new AppDbContext(optionsBuilder.Options);
        var model = ctx.Model;  // forces OnModelCreating to run

        // THEN
        Assert.NotNull(model);
    }
}
