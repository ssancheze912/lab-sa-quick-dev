using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Infrastructure.Data.Configurations;
using SiesaAgents.Infrastructure.Data.Extensions;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // ContactoEntity is added starting Epic 3. Do not add it in this story.
    public DbSet<ClienteEntity> Clientes => Set<ClienteEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfiguration(new ClienteConfiguration());

        // MUST remain the last call — converts all EF-managed identifiers to snake_case
        modelBuilder.ApplySnakeCaseNaming();
    }
}
