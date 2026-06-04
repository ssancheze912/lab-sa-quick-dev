using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

/// <summary>
/// Main EF Core DbContext for SiesaAgents.
/// Uses PostgreSQL with automatic snake_case naming conventions.
/// </summary>
public class SiesaAgentsDbContext(DbContextOptions<SiesaAgentsDbContext> options) : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(SiesaAgentsDbContext).Assembly);
    }
}
