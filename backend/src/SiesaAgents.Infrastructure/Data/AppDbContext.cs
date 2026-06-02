using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Infrastructure.Data.Extensions;

namespace SiesaAgents.Infrastructure.Data;

/// <summary>
/// Application database context for SiesaAgents.
///
/// Story 2.1 introduces the first domain <c>DbSet&lt;T&gt;</c>:
/// <see cref="Clientes"/>. The Configurations folder is auto-discovered via
/// <c>ApplyConfigurationsFromAssembly(...)</c> so future entity mappings
/// (e.g. <c>ContactoConfiguration</c> in Epic 3) are picked up automatically.
/// </summary>
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<ClienteEntity> Clientes => Set<ClienteEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Discovers IEntityTypeConfiguration<T> classes in this assembly
        // (e.g. ClienteConfiguration). MUST run BEFORE ApplySnakeCaseNaming
        // so the snake_case extension can rewrite the names the configurations set.
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // MUST be the LAST call — converts every table/column/key/FK/index
        // name to lower snake_case so future migrations follow PostgreSQL
        // conventions (see company standards: Database Conventions).
        modelBuilder.ApplySnakeCaseNaming();
    }
}
