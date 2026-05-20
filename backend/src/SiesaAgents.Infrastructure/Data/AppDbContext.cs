using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply IEntityTypeConfiguration<T> files here in future stories:
        // modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // MUST be called LAST — converts all PascalCase names to snake_case automatically
        modelBuilder.ApplySnakeCaseNaming();
    }
}
