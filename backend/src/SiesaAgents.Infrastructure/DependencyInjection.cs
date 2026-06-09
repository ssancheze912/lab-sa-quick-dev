using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.Infrastructure;

/// <summary>
/// Infrastructure layer composition root.
///
/// Story 1.3 — registers <see cref="AppDbContext"/> against PostgreSQL using Npgsql
/// and applies <c>UseSnakeCaseNamingConvention()</c> at the convention level
/// (complementary to the explicit <c>ApplySnakeCaseNaming()</c> call inside
/// <see cref="AppDbContext.OnModelCreating"/> mandated by company standards).
/// </summary>
public static class DependencyInjection
{
    /// <summary>
    /// Registers infrastructure services (DbContext, naming convention) using the
    /// <c>ConnectionStrings:DefaultConnection</c> value from the supplied configuration.
    /// </summary>
    /// <param name="services">DI container.</param>
    /// <param name="configuration">Configuration source (must expose
    /// <c>ConnectionStrings:DefaultConnection</c>).</param>
    /// <returns>The same <paramref name="services"/> instance for chaining.</returns>
    /// <exception cref="InvalidOperationException">Thrown when the required connection
    /// string is missing — fail-fast at startup rather than at first request.</exception>
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException(
                "Missing required configuration value 'ConnectionStrings:DefaultConnection'.");

        services.AddDbContext<AppDbContext>(options =>
            options
                .UseNpgsql(connectionString)
                .UseSnakeCaseNamingConvention());

        return services;
    }
}
