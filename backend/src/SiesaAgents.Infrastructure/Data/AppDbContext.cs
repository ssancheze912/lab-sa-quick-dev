using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

/// <summary>
/// Root EF Core context for the Siesa Agents service.
///
/// Story 1.3 ships this DbContext with NO <c>DbSet&lt;T&gt;</c> declarations on purpose —
/// <c>ClienteEntity</c> is added by Story 2.1 and <c>ContactoEntity</c> by Story 3.1.
/// The initial EF migration is therefore empty (only <c>__ef_migrations_history</c>
/// is materialized when <c>dotnet ef database update</c> runs).
/// </summary>
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Future stories will register IEntityTypeConfiguration<T> implementations here:
        //   modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // MUST be the LAST call — rewrites every table/column/index/FK name to snake_case.
        modelBuilder.ApplySnakeCaseNaming();
    }
}
