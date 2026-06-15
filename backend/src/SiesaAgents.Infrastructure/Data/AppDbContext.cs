using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data.Extensions;

namespace SiesaAgents.Infrastructure.Data;

/// <summary>
/// Root EF Core context for the Siesa Agents service. Entities are added in
/// later stories (Story 2.1 — Clientes, Story 3.1 — Contactos); this story
/// only wires the context, applies the snake_case naming convention, and
/// supports the empty <c>InitialCreate</c> migration.
/// </summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    // NO DbSet<T> declarations in this story — entities arrive in Stories 2.1 / 3.1.

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        // MUST be the LAST call — company standard. See:
        // .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions
        modelBuilder.ApplySnakeCaseNaming();
    }
}
