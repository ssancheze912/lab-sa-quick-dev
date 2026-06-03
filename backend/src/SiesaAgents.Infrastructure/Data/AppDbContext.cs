using Microsoft.EntityFrameworkCore;
using SiesaAgents.Application.Interfaces;
using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options), IClientesDbContext
{
    public DbSet<ClienteEntity> Clientes => Set<ClienteEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply EF Core configurations from Infrastructure/Data/Configurations/
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // ALWAYS last: Apply snake_case naming for all columns/tables → PostgreSQL convention
        modelBuilder.UseSnakeCaseNamingConvention();
    }
}
