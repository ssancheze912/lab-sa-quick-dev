using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Infrastructure.Data.Conventions;

namespace SiesaAgents.Infrastructure.Data;

/// <summary>
/// Primary application EF Core context.
///
/// Story 2.1 adds the <see cref="Clientes"/> DbSet + the
/// <c>ApplyConfigurationsFromAssembly</c> hook so the
/// <see cref="Configurations.ClienteConfiguration"/> is picked up. The
/// convention application order is critical: PascalCase configuration first,
/// then <see cref="SnakeCaseNamingConvention.ApplySnakeCaseNaming"/> LAST so
/// it observes the finalised metadata.
/// </summary>
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<ClienteEntity> Clientes => Set<ClienteEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Discover IEntityTypeConfiguration<> implementations in the Infrastructure
        // assembly (e.g. ClienteConfiguration) before snake_case normalization runs.
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // CRITICAL: snake_case naming must be the LAST call inside OnModelCreating
        // per company-standards.md and test-design-epic-1.md §10 rule #2.
        modelBuilder.ApplySnakeCaseNaming();
    }
}
