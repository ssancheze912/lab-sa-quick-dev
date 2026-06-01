using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Clientes.Entities;
using System.Reflection;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<ClienteEntity> Clientes => Set<ClienteEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Apply entity type configurations from this assembly
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        // Note: UseSnakeCaseNamingConvention() is applied via DbContextOptionsBuilder in DI registration (Program.cs)
        // per EFCore.NamingConventions API — it configures the options extension, not the model builder
    }
}
