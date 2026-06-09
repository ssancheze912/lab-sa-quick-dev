using SiesaAgents.Infrastructure;
using SiesaAgents.Infrastructure.Data;
using Microsoft.Extensions.Configuration;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// AC #2 + AC #6 — AddInfrastructure(IConfiguration) registers AppDbContext using
/// the configuration-provided connection string.
///
/// EXPECTED RED-PHASE FAILURE REASONS (until Story 1.3 is implemented):
///   1. SiesaAgents.Infrastructure.DependencyInjection.AddInfrastructure(...)
///      does not yet exist → compile error.
///   2. AppDbContext is not yet defined → compile error.
///   3. Missing connection string is not yet validated → InvalidOperationException not thrown.
/// </summary>
public class AddInfrastructureDiTests
{
    /// <summary>
    /// GIVEN a configuration with ConnectionStrings:DefaultConnection set,
    /// WHEN AddInfrastructure is called and the ServiceProvider is built,
    /// THEN AppDbContext can be resolved.
    /// </summary>
    [Fact]
    public void AddInfrastructure_RegistersAppDbContext_WhenConnectionStringIsPresent()
    {
        // GIVEN
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] =
                    "Host=fake;Database=fake;Username=fake;Password=fake"
            })
            .Build();

        var services = new ServiceCollection();

        // WHEN
        services.AddInfrastructure(configuration);
        using var provider = services.BuildServiceProvider();
        using var scope = provider.CreateScope();
        var ctx = scope.ServiceProvider.GetService<AppDbContext>();

        // THEN
        Assert.NotNull(ctx);
    }

    /// <summary>
    /// GIVEN a configuration with NO ConnectionStrings:DefaultConnection key,
    /// WHEN AddInfrastructure is called,
    /// THEN InvalidOperationException is thrown — fail-fast on missing required config.
    ///
    /// AC #6: connection string must come from configuration, not hardcoded.
    /// </summary>
    [Fact]
    public void AddInfrastructure_Throws_WhenConnectionStringIsMissing()
    {
        // GIVEN
        var configuration = new ConfigurationBuilder().Build();  // empty configuration
        var services = new ServiceCollection();

        // WHEN / THEN
        Assert.Throws<InvalidOperationException>(() =>
            services.AddInfrastructure(configuration));
    }
}
