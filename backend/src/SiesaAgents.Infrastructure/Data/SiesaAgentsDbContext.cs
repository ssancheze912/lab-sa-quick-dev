using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Infrastructure.Data;

public class SiesaAgentsDbContext(DbContextOptions<SiesaAgentsDbContext> options) : DbContext(options)
{
    public DbSet<ClienteEntity> Clientes => Set<ClienteEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(SiesaAgentsDbContext).Assembly);
    }
}
