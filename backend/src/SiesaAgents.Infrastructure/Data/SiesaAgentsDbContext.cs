using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public class SiesaAgentsDbContext(DbContextOptions<SiesaAgentsDbContext> options) : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(SiesaAgentsDbContext).Assembly);
    }
}
