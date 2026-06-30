using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // No DbSet<> properties in this story — entities added in Epic 2 and Epic 3

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        // Apply entity configurations here in future stories:
        // modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // CRITICAL: UseSnakeCaseNamingConvention is applied via DbContextOptions in Program.cs
        // ApplySnakeCaseNaming() is a no-op model-level call for future entity configs
    }
}
