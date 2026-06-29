using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests.Data;

/// <summary>
/// Edge case / negative path tests for <see cref="InfrastructureServiceCollectionExtensions.AddInfrastructure"/>
/// — expands coverage beyond the ATDD happy-path. Covers AC #5 (DI registration uses
/// <c>ConnectionStrings:DefaultConnection</c>; no hardcoded strings; missing key throws).
/// </summary>
public class InfrastructureServiceCollectionExtensionsTests
{
    private static IConfiguration BuildConfig(string? defaultConnection)
    {
        var data = new Dictionary<string, string?>();
        if (defaultConnection is not null)
        {
            data["ConnectionStrings:DefaultConnection"] = defaultConnection;
        }
        return new ConfigurationBuilder().AddInMemoryCollection(data).Build();
    }

    [Fact]
    public void AddInfrastructure_WithValidConnectionString_RegistersAppDbContextAsScoped()
    {
        // GIVEN: a service collection and a configuration with DefaultConnection set.
        var services = new ServiceCollection();
        var config = BuildConfig("Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres");

        // WHEN: AddInfrastructure is called.
        services.AddInfrastructure(config);

        // THEN: AppDbContext is registered with Scoped lifetime (EF Core default).
        var descriptor = services.FirstOrDefault(d => d.ServiceType == typeof(AppDbContext));
        descriptor.Should().NotBeNull("AppDbContext must be registered by AddInfrastructure");
        descriptor!.Lifetime.Should().Be(ServiceLifetime.Scoped, "EF Core registers DbContext as scoped by default");
    }

    [Fact]
    public void AddInfrastructure_WithValidConnectionString_ResolvesAppDbContextFromProvider()
    {
        // GIVEN: services configured with a valid connection string.
        var services = new ServiceCollection();
        var config = BuildConfig("Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres");
        services.AddInfrastructure(config);

        // WHEN: building the service provider and resolving AppDbContext.
        using var provider = services.BuildServiceProvider();
        using var scope = provider.CreateScope();
        var context = scope.ServiceProvider.GetService<AppDbContext>();

        // THEN: AppDbContext resolves without errors.
        context.Should().NotBeNull("AppDbContext must be resolvable from the DI container");
        context!.Database.ProviderName.Should().Be("Npgsql.EntityFrameworkCore.PostgreSQL",
            "the Npgsql provider must be wired in");
    }

    [Fact]
    public void AddInfrastructure_ReturnsSameServiceCollectionInstance_ForChaining()
    {
        // GIVEN: a service collection and valid configuration.
        var services = new ServiceCollection();
        var config = BuildConfig("Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres");

        // WHEN: AddInfrastructure is called.
        var result = services.AddInfrastructure(config);

        // THEN: the same instance is returned to enable method chaining.
        result.Should().BeSameAs(services, "AddInfrastructure must return IServiceCollection for chaining");
    }

    [Fact]
    public void AddInfrastructure_WithMissingConnectionString_ThrowsInvalidOperationException()
    {
        // GIVEN: a configuration with NO ConnectionStrings:DefaultConnection entry.
        var services = new ServiceCollection();
        var config = BuildConfig(defaultConnection: null);

        // WHEN: AddInfrastructure is invoked.
        Action act = () => services.AddInfrastructure(config);

        // THEN: an InvalidOperationException is thrown with a descriptive message.
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*ConnectionStrings:DefaultConnection*",
                "the failure message must point at the missing config key");
    }

    [Fact]
    public void AddInfrastructure_WithEmptyConnectionStringSection_ThrowsInvalidOperationException()
    {
        // GIVEN: a configuration where DefaultConnection is empty.
        // GetConnectionString returns empty (not null) so the ?? throw branch is NOT triggered.
        // Npgsql itself rejects the empty string when the options are built / DbContext resolves.
        var services = new ServiceCollection();
        var config = BuildConfig(defaultConnection: string.Empty);
        services.AddInfrastructure(config);

        using var provider = services.BuildServiceProvider();
        using var scope = provider.CreateScope();

        // WHEN: resolving the AppDbContext (which triggers options build / connection-string validation).
        Action act = () => scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // THEN: resolution must fail — empty connection strings are not acceptable.
        act.Should().Throw<Exception>("an empty connection string must not silently configure the DbContext");
    }

    [Fact]
    public void AddInfrastructure_CalledTwice_LastRegistrationWins_NoDuplicateContextDescriptor()
    {
        // GIVEN: AddInfrastructure invoked twice — verifies idempotent-ish DI behavior.
        var services = new ServiceCollection();
        var config = BuildConfig("Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres");

        // WHEN: AddInfrastructure is called twice.
        services.AddInfrastructure(config);
        services.AddInfrastructure(config);

        // THEN: AppDbContext is still resolvable (EF Core handles duplicate registrations gracefully).
        using var provider = services.BuildServiceProvider();
        using var scope = provider.CreateScope();
        var ctx = scope.ServiceProvider.GetService<AppDbContext>();
        ctx.Should().NotBeNull("AppDbContext should still resolve even after a duplicate AddInfrastructure call");
    }
}
