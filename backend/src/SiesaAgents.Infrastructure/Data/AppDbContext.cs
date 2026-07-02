using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Infrastructure.Data;

/// <summary>
/// Primary EF Core DbContext for the Siesa Agents service.
/// </summary>
/// <remarks>
/// NOTE: <c>DbSet&lt;ContactoEntity&gt;</c> is added in Epic 3 Story 3.1.
/// </remarks>
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<ClienteEntity> Clientes => Set<ClienteEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Applies all IEntityTypeConfiguration<T> found in this assembly.
        // Picks up ClienteConfiguration (Story 2.1) and future ContactoConfiguration (Epic 3).
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // MUST be the LAST statement — operates on the final metadata graph.
        modelBuilder.ApplySnakeCaseNaming();
    }
}
