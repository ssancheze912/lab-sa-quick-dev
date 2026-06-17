using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // DbSet<> properties will be added in Epic 2 (ClienteEntity) and Epic 3 (ContactoEntity)
    // DO NOT add any DbSet here in Story 1.3

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply all entity type configurations from this assembly (for future stories)
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // CRITICAL: ApplySnakeCaseNaming MUST be the LAST call in OnModelCreating
        modelBuilder.ApplySnakeCaseNaming();
    }
}
