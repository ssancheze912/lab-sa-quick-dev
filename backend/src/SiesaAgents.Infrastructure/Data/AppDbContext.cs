using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

/// <summary>
/// Primary EF Core DbContext for the Siesa Agents service.
/// </summary>
/// <remarks>
/// NOTE: <c>DbSet&lt;ClienteEntity&gt;</c> is added in Epic 2 Story 2.1.
/// NOTE: <c>DbSet&lt;ContactoEntity&gt;</c> is added in Epic 3 Story 3.1.
/// Do NOT add domain DbSets in this story — scope note from Epic 1 Story 1.3.
/// </remarks>
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Applies all IEntityTypeConfiguration<T> found in this assembly.
        // Empty in Story 1.3; will pick up ClienteConfiguration in Epic 2, ContactoConfiguration in Epic 3.
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // MUST be the LAST statement — operates on the final metadata graph.
        modelBuilder.ApplySnakeCaseNaming();
    }
}
