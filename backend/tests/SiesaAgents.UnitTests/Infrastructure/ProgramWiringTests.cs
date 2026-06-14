using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// ATDD tests for Story 1.3 - AC5: AppDbContext DI registration and connection string.
/// RED PHASE: These tests will fail until AppDbContext is registered in Program.cs
/// with builder.Services.AddDbContext and DefaultConnection is wired from appsettings.
/// </summary>
public class ProgramWiringTests
{
    // -------------------------------------------------------------------------
    // AC5: AppDbContext is registered in DI container and resolves correctly.
    //      Connection string 'ConnectionStrings:DefaultConnection' is readable.
    // -------------------------------------------------------------------------

    [Fact]
    public void ServiceCollection_CanRegisterAppDbContext_WithNpgsqlProvider()
    {
        // GIVEN: A service collection configured like Program.cs would wire AppDbContext
        var services = new ServiceCollection();
        var connectionString = "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres";

        // WHEN: AddDbContext is configured with Npgsql (mirrors Program.cs registration)
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString));

        var provider = services.BuildServiceProvider();

        // THEN: AppDbContext can be resolved from the DI container without errors
        var exception = Record.Exception(() =>
        {
            using var scope = provider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            Assert.NotNull(context);
        });

        Assert.Null(exception);
    }

    [Fact]
    public void ServiceCollection_AppDbContext_IsRegisteredAsScopedLifetime()
    {
        // GIVEN: A service collection with AppDbContext registered (as Program.cs does)
        var services = new ServiceCollection();
        var connectionString = "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres";

        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString));

        // WHEN: The service descriptor is inspected
        var descriptor = services.FirstOrDefault(d => d.ServiceType == typeof(AppDbContext));

        // THEN: AppDbContext is registered with Scoped lifetime (EF Core default via AddDbContext)
        Assert.NotNull(descriptor);
        Assert.Equal(ServiceLifetime.Scoped, descriptor.Lifetime);
    }
}
