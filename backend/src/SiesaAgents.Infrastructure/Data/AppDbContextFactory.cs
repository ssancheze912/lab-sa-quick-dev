using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace SiesaAgents.Infrastructure.Data;

/// <summary>
/// Design-time factory consumed by the EF Core CLI (<c>dotnet ef ...</c>) to
/// instantiate <see cref="AppDbContext"/> without booting the ASP.NET Core host.
///
/// Reads <c>ConnectionStrings:DefaultConnection</c> from the API project's
/// <c>appsettings.json</c> / <c>appsettings.Development.json</c> so the tooling
/// uses the SAME connection string as the running application (single source of truth).
/// </summary>
public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var apiPath = Path.GetFullPath(
            Path.Combine(Directory.GetCurrentDirectory(), "..", "SiesaAgents.API"));

        var configuration = new ConfigurationBuilder()
            .SetBasePath(apiPath)
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException(
                "Missing 'ConnectionStrings:DefaultConnection' for design-time EF Core tooling. "
                + "Set it in backend/src/SiesaAgents.API/appsettings.Development.json or via "
                + "the ConnectionStrings__DefaultConnection environment variable.");

        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionString)
            .UseSnakeCaseNamingConvention();

        return new AppDbContext(optionsBuilder.Options);
    }
}
