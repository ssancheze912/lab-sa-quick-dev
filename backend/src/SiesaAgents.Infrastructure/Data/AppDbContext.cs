using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data.Conventions;

namespace SiesaAgents.Infrastructure.Data;

/// <summary>
/// Primary application EF Core context.
///
/// Story 1.3 scope: no <c>DbSet&lt;T&gt;</c> declarations — domain entities land
/// in Epic 2 (ClienteEntity) and Epic 3 (ContactoEntity). Adding them here now
/// would leak into the initial migration and violate the epic scope note.
/// </summary>
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Future: modelBuilder.HasDefaultSchema("crm");  // enable when domain tables land in Epic 2.
        // Future: modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // CRITICAL: snake_case naming must be the LAST call inside OnModelCreating
        // per company-standards.md and test-design-epic-1.md §10 rule #2.
        modelBuilder.ApplySnakeCaseNaming();
    }
}
