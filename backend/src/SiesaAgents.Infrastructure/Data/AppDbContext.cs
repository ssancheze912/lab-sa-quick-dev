using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // No DbSet<> properties in this story — added in Story 2.1 (ClienteEntity) and Story 3.1 (ContactoEntity)

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        // Apply all entity configurations via assembly scanning (ready for future stories)
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        // MUST be last — converts all C# PascalCase property names to snake_case column names automatically
        modelBuilder.ApplySnakeCaseNaming();
    }
}
