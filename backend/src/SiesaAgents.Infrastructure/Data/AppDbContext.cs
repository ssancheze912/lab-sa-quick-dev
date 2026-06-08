using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Entities;

namespace SiesaAgents.Infrastructure.Data;

/// <summary>
/// Root EF Core context for the Siesa Agents service.
///
/// Story 2.1 introduces <see cref="ClienteEntity"/> as the first real DbSet.
/// Future stories add additional DbSets and rely on
/// <c>ApplyConfigurationsFromAssembly</c> to auto-register their
/// <c>IEntityTypeConfiguration&lt;T&gt;</c> implementations.
/// </summary>
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<ClienteEntity> Clientes => Set<ClienteEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Pulls every IEntityTypeConfiguration<T> from this assembly (Infrastructure)
        // — currently ClienteConfiguration; future stories' configurations are
        // picked up automatically.
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // MUST be the LAST call — rewrites every table/column/index/FK name to snake_case.
        modelBuilder.ApplySnakeCaseNaming();
    }
}
