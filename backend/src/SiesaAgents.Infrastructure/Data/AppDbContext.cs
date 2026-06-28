using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // DbSet<> properties will be added in Epics 2 and 3
    // Example for future stories:
    // public DbSet<ClienteEntity> Clientes => Set<ClienteEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply entity configurations from assembly (used in future stories)
        // modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // MANDATORY: Applied via UseSnakeCaseNamingConvention() on DbContextOptionsBuilder in DI registration
        // This satisfies AC3 — all column names follow snake_case convention
    }
}
