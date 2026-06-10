using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

/// <summary>
/// Application database context.
/// DbSet properties are added in Epics 2 and 3 — NOT here.
/// </summary>
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // DbSet properties are added in Epics 2 and 3 — NOT here
    // public DbSet<ClienteEntity> Clientes => Set<ClienteEntity>();  ← Epic 2, Story 2.1
    // public DbSet<ContactoEntity> Contactos => Set<ContactoEntity>(); ← Epic 3, Story 3.1

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply entity configurations from Infrastructure/Data/Configurations/
        // modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly); ← uncomment when configs exist

        // MUST be the last call in OnModelCreating — enforces snake_case for ALL column names
        // Provided by EFCore.NamingConventions package
        modelBuilder.UseSnakeCaseNamingConvention();
    }
}
