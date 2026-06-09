using SiesaAgents.Infrastructure;
using SiesaAgents.Infrastructure.Data;
using Microsoft.Extensions.Configuration;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// Edge-case coverage for <c>DependencyInjection.AddInfrastructure</c> beyond the
/// happy-path tests in <see cref="AddInfrastructureDiTests"/>.
///
/// Focus areas:
///   * Null-argument guards (services, configuration) — fail-fast contract.
///   * <c>AppDbContext</c> is registered as Scoped, not Singleton or Transient
///     (EF Core requirement; DbContext is not thread-safe).
///   * <c>AddInfrastructure</c> returns the SAME <c>IServiceCollection</c> for chaining.
///   * The Npgsql provider is selected (not InMemory or Sqlite).
///   * Empty / whitespace connection strings are accepted by the extension
///     (Npgsql will throw later when opening — that is by design; the extension
///     only validates "key present").
///   * Calling <c>AddInfrastructure</c> twice with the same configuration does
///     not duplicate registrations in a way that breaks DI resolution.
/// </summary>
public class AddInfrastructureEdgeCasesTests
{
    /// <summary>
    /// Defensive contract — <c>services</c> parameter cannot be null.
    /// </summary>
    [Fact]
    public void AddInfrastructure_Throws_WhenServicesIsNull()
    {
        // GIVEN
        var configuration = new ConfigurationBuilder().Build();
        IServiceCollection? services = null;

        // WHEN / THEN
        Assert.Throws<ArgumentNullException>(() =>
            services!.AddInfrastructure(configuration));
    }

    /// <summary>
    /// Defensive contract — <c>configuration</c> parameter cannot be null.
    /// </summary>
    [Fact]
    public void AddInfrastructure_Throws_WhenConfigurationIsNull()
    {
        // GIVEN
        var services = new ServiceCollection();
        IConfiguration? configuration = null;

        // WHEN / THEN
        Assert.Throws<ArgumentNullException>(() =>
            services.AddInfrastructure(configuration!));
    }

    /// <summary>
    /// Fluent-API contract — the extension must return the SAME services instance
    /// it received, enabling chained registrations in <c>Program.cs</c>.
    /// </summary>
    [Fact]
    public void AddInfrastructure_ReturnsSameServiceCollection_ForChaining()
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
        var returned = services.AddInfrastructure(configuration);

        // THEN
        Assert.Same(services, returned);
    }

    /// <summary>
    /// EF Core contract — <c>DbContext</c> must be registered with
    /// <c>ServiceLifetime.Scoped</c>. Registering it as Singleton would cause
    /// runtime thread-safety failures; registering it as Transient would break
    /// the unit-of-work pattern.
    /// </summary>
    [Fact]
    public void AddInfrastructure_RegistersAppDbContext_WithScopedLifetime()
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

        // THEN
        var descriptor = services.FirstOrDefault(d => d.ServiceType == typeof(AppDbContext));
        Assert.NotNull(descriptor);
        Assert.Equal(ServiceLifetime.Scoped, descriptor!.Lifetime);
    }

    /// <summary>
    /// AC #2 — the Npgsql provider must be selected by <c>AddInfrastructure</c>.
    /// Resolves the context and asserts the provider name.
    /// </summary>
    [Fact]
    public void AddInfrastructure_ResolvedAppDbContext_UsesNpgsqlProvider()
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
        services.AddInfrastructure(configuration);

        // WHEN
        using var provider = services.BuildServiceProvider();
        using var scope = provider.CreateScope();
        var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // THEN
        Assert.Equal("Npgsql.EntityFrameworkCore.PostgreSQL", ctx.Database.ProviderName);
    }

    /// <summary>
    /// Edge case — an EMPTY connection string in configuration must NOT trigger
    /// the missing-key throw (<c>GetConnectionString</c> returns an empty string,
    /// not null, when the key exists). Npgsql will then throw when opening a
    /// connection — that is the desired separation of concerns.
    /// </summary>
    [Fact]
    public void AddInfrastructure_DoesNotThrow_WhenConnectionStringIsEmpty()
    {
        // GIVEN
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = ""
            })
            .Build();
        var services = new ServiceCollection();

        // WHEN / THEN — registration succeeds; failure deferred to first connection use.
        var exception = Record.Exception(() => services.AddInfrastructure(configuration));
        Assert.Null(exception);
    }

    /// <summary>
    /// Edge case — two consecutive <c>AddInfrastructure</c> calls do not corrupt
    /// the container; the last call's <c>AppDbContext</c> registration wins (or
    /// both coexist with identical options). DI must still resolve a usable
    /// context without throwing.
    /// </summary>
    [Fact]
    public void AddInfrastructure_CalledTwice_StillResolvesAppDbContext()
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
        services.AddInfrastructure(configuration);

        // THEN
        using var provider = services.BuildServiceProvider();
        using var scope = provider.CreateScope();
        var ctx = scope.ServiceProvider.GetService<AppDbContext>();
        Assert.NotNull(ctx);
    }

    /// <summary>
    /// AC #6 contract — the connection string is read from the configuration via
    /// <c>GetConnectionString("DefaultConnection")</c>. Verify by supplying a
    /// value under the colon-separated key path (the only way ASP.NET Core's
    /// configuration system exposes connection strings) and confirming registration
    /// succeeds.
    /// </summary>
    [Fact]
    public void AddInfrastructure_ReadsConnectionStringFromConnectionStringsSection()
    {
        // GIVEN — value lives under "ConnectionStrings:DefaultConnection"
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] =
                    "Host=alt;Database=alt;Username=alt;Password=alt"
            })
            .Build();
        var services = new ServiceCollection();

        // WHEN
        services.AddInfrastructure(configuration);

        // THEN
        using var provider = services.BuildServiceProvider();
        using var scope = provider.CreateScope();
        var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.NotNull(ctx);
    }

    /// <summary>
    /// AC #6 negative — a value placed under the wrong key
    /// (<c>DefaultConnection</c> at root, not under <c>ConnectionStrings:</c>)
    /// must NOT be honored. Guards against a regression where someone changes
    /// the lookup to <c>configuration["DefaultConnection"]</c> directly.
    /// </summary>
    [Fact]
    public void AddInfrastructure_IgnoresMisplacedKey_AndThrowsMissingConfig()
    {
        // GIVEN — value at root, NOT under ConnectionStrings:
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["DefaultConnection"] = "Host=root;Database=root;Username=root;Password=root"
            })
            .Build();
        var services = new ServiceCollection();

        // WHEN / THEN
        Assert.Throws<InvalidOperationException>(() =>
            services.AddInfrastructure(configuration));
    }
}
