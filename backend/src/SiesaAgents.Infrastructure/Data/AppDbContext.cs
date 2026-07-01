using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Entities;

namespace SiesaAgents.Infrastructure.Data;

/// <summary>
/// Application EF Core DbContext. Establishes the migration/naming pipeline for
/// subsequent stories. First DbSet (`Clientes`) added in Story 2.1.
/// </summary>
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<ClienteEntity> Clientes => Set<ClienteEntity>();

    public DbSet<ContactoEntity> Contactos => Set<ContactoEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        modelBuilder.ApplySnakeCaseNaming();
    }
}
