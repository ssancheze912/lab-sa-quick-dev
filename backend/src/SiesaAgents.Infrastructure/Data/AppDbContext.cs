using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // DbSet properties for domain entities are added in Epic 2+ stories.
    // This story intentionally leaves AppDbContext empty of domain sets.

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        // Entity configurations are applied via ApplyConfigurationsFromAssembly in future stories.
        // snake_case naming convention is applied via UseSnakeCaseNamingConvention()
        // registered in DbContextOptionsBuilder (Program.cs) — all table and column
        // names are automatically converted to snake_case without manual [Column]/[Table] attributes.
    }
}
