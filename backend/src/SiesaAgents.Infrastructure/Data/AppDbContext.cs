using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    // No DbSet<> properties in this story — entities added in Epic 2 and 3

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply entity configurations (IEntityTypeConfiguration<>) when they exist
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // MANDATORY: snake_case naming for all tables and columns — MUST be last
        modelBuilder.ApplySnakeCaseNaming();
    }
}
