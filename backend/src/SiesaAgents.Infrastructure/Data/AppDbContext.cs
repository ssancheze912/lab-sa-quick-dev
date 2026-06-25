using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Contactos.Entities;
using SiesaAgents.Infrastructure.Data.Configurations;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<ClienteEntity> Clientes => Set<ClienteEntity>();
    public DbSet<ContactoEntity> Contactos => Set<ContactoEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfiguration(new ClienteConfiguration());
        modelBuilder.ApplyConfiguration(new ContactoConfiguration());
        // Snake_case naming is applied via UseSnakeCaseNamingConvention() in DbContextOptionsBuilder (Program.cs)
        // EFCore.NamingConventions intercepts the convention pipeline — no explicit call needed here
    }
}
