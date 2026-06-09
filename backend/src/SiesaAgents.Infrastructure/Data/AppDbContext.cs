using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data.Extensions;

namespace SiesaAgents.Infrastructure.Data;

/// <summary>
/// Application DbContext for SiesaAgents.
///
/// Story 1.3 scope: infrastructure-only. No DbSet&lt;&gt; properties / no entities yet.
/// Domain entities (ClienteEntity, ContactoEntity) will be added in Epic 2/3.
///
/// OnModelCreating MUST end with <c>modelBuilder.ApplySnakeCaseNaming()</c> as the
/// LAST statement, per company standards (Database Conventions, PostgreSQL).
/// </summary>
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        modelBuilder.ApplySnakeCaseNaming(); // MUST be the last call
    }
}
