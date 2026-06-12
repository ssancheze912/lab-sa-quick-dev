using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

/// <summary>
/// EF Core DbContext for SiesaAgents application.
/// Uses Npgsql provider with automatic snake_case naming convention.
/// DbSet properties for domain entities will be added in Epics 2 and 3.
/// </summary>
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // DbSet<> properties are added in subsequent stories (Epics 2 and 3).
    // DO NOT define ClienteEntity or ContactoEntity here — scope note per Story 1.3.

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply entity type configurations from this assembly (none in Story 1.3)
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // MUST be the LAST call — converts all PascalCase entity/property names to snake_case
        // This ensures all current and future column names follow snake_case convention (AC4)
        modelBuilder.ApplySnakeCaseNaming();
    }
}
