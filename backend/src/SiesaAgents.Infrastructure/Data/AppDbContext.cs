using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data.Extensions;

namespace SiesaAgents.Infrastructure.Data;

/// <summary>
/// Application database context for SiesaAgents.
///
/// Story 1.3 scope: foundational EF Core wiring only — no domain
/// <c>DbSet&lt;T&gt;</c> properties yet. Domain tables (<c>clientes</c>,
/// <c>contactos</c>) arrive in Epic 2 (Story 2.1) and Epic 3 (Story 3.1).
/// </summary>
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // No DbSet<T> properties — domain tables arrive in Epic 2 / Epic 3.
    // Do NOT add them here.

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // MUST be the LAST call — converts every table/column/key/FK/index
        // name to lower snake_case so future migrations follow PostgreSQL
        // conventions (see company standards: Database Conventions).
        modelBuilder.ApplySnakeCaseNaming();
    }
}
