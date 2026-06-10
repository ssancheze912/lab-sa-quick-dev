using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Infrastructure.Data;

/// <summary>
/// Application database context.
/// ApplySnakeCaseNaming (UseSnakeCaseNamingConvention) MUST be the last call in OnModelCreating.
/// </summary>
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<ClienteEntity> Clientes => Set<ClienteEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // MUST be the last call in OnModelCreating — enforces snake_case for ALL column names
        // Provided by EFCore.NamingConventions package
        modelBuilder.UseSnakeCaseNamingConvention();
    }
}
