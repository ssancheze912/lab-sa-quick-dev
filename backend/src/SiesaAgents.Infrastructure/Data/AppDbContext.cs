using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // No DbSet<> properties at this stage.
    // ClienteEntity and ContactoEntity DbSets are added in Epic 2 (Story 2.1) and Epic 3 (Story 3.1).

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply EF Core configurations from Infrastructure/Data/Configurations/
        // (no configurations at this stage — added per entity in Epic 2 and Epic 3)
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // ALWAYS last: Apply snake_case naming for all columns/tables → PostgreSQL convention
        modelBuilder.UseSnakeCaseNamingConvention();
    }
}
