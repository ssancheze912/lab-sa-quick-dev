using SiesaAgents.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Design;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// AC #7 — IDesignTimeDbContextFactory&lt;AppDbContext&gt; is present so
/// `dotnet ef migrations add &lt;Name&gt;` works without the API host running.
///
/// EXPECTED RED-PHASE FAILURE REASONS (until Story 1.3 is implemented):
///   1. SiesaAgents.Infrastructure.Data.AppDbContextFactory class does not yet exist
///      → compile error.
///   2. The factory does not implement IDesignTimeDbContextFactory&lt;AppDbContext&gt;
///      → type-load error or assertion failure.
/// </summary>
public class AppDbContextFactoryTests
{
    /// <summary>
    /// GIVEN the Infrastructure assembly is loaded,
    /// WHEN we look for a public type implementing IDesignTimeDbContextFactory&lt;AppDbContext&gt;,
    /// THEN exactly one such type exists (AppDbContextFactory).
    /// </summary>
    [Fact]
    public void IDesignTimeDbContextFactory_IsImplementedInInfrastructureAssembly()
    {
        // GIVEN
        var infrastructureAssembly = typeof(AppDbContext).Assembly;

        // WHEN
        var factoryTypes = infrastructureAssembly
            .GetTypes()
            .Where(t => !t.IsAbstract
                        && !t.IsInterface
                        && typeof(IDesignTimeDbContextFactory<AppDbContext>).IsAssignableFrom(t))
            .ToList();

        // THEN
        Assert.Single(factoryTypes);
    }
}
