using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // DbSet<> properties will be added in Epic 2+ (ClienteEntity, ContactoEntity)

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply entity configurations from this assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // Snake_case naming is applied via UseSnakeCaseNamingConvention() in DbContextOptions
        // (registered in Program.cs), which hooks into the model building pipeline automatically.
        // This ensures all column/table names follow snake_case convention (AC3).
    }
}
