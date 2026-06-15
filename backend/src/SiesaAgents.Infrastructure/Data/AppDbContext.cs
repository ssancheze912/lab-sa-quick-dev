using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Infrastructure.Data.Extensions;

namespace SiesaAgents.Infrastructure.Data;

/// <summary>
/// Root EF Core context for the Siesa Agents service. Story 2.1 introduces
/// the <c>clientes</c> aggregate; future stories will append additional
/// <c>DbSet</c>s (Contactos, etc.).
/// </summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<ClienteEntity> Clientes => Set<ClienteEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        // MUST be the LAST call — company standard. See:
        // .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions
        modelBuilder.ApplySnakeCaseNaming();
    }
}
