using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Infrastructure.Data;

/// <summary>
/// Primary EF Core DbContext for the SiesaAgents backend.
/// Owns the snake_case naming convention applied via <see cref="EFCore.NamingConventions"/>.
/// </summary>
/// <remarks>
/// Story 2.1 — added <c>DbSet&lt;ClienteEntity&gt;</c> and registered the <c>pg_trgm</c>
/// PostgreSQL extension required by the GIN trigram index on <c>clientes.nombre</c>.
/// </remarks>
public sealed class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<ClienteEntity> Clientes => Set<ClienteEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Auto-discover every IEntityTypeConfiguration<T> in this assembly.
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // pg_trgm extension — backs the GIN trigram index for ILIKE search.
        modelBuilder.HasPostgresExtension("pg_trgm");

        // MUST be the LAST call — company-standards.md §Database Conventions.
        modelBuilder.ApplySnakeCaseNaming();
    }
}
