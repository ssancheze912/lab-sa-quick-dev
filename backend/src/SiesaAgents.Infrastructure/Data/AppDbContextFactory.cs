using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace SiesaAgents.Infrastructure.Data;

/// <summary>
/// Design-time factory for EF Core CLI tools (dotnet ef migrations).
/// Required because AppDbContext relies on runtime DI configuration.
/// </summary>
public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        optionsBuilder.UseNpgsql(
            "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres");

        return new AppDbContext(optionsBuilder.Options);
    }
}
