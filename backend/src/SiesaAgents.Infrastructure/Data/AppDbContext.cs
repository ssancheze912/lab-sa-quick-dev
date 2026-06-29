using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

/// <summary>
/// Primary EF Core DbContext for the SiesaAgents backend.
/// Owns the snake_case naming convention applied via <see cref="EFCore.NamingConventions"/>.
/// </summary>
/// <remarks>
/// No <see cref="DbSet{TEntity}"/> declarations live here yet — domain entities arrive in:
/// <list type="bullet">
/// <item><description>Story 2.1 — <c>ClienteEntity</c></description></item>
/// <item><description>Story 3.1 — <c>ContactoEntity</c></description></item>
/// </list>
/// Future entity configurations must be added under
/// <c>SiesaAgents.Infrastructure/Data/Configurations/</c> implementing
/// <see cref="IEntityTypeConfiguration{TEntity}"/> — they are auto-discovered by
/// <see cref="ModelBuilder.ApplyConfigurationsFromAssembly(System.Reflection.Assembly, System.Func{System.Type, bool}?)"/>.
/// </remarks>
public sealed class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Auto-discover every IEntityTypeConfiguration<T> in this assembly.
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // MUST be the LAST call — company-standards.md §Database Conventions.
        modelBuilder.ApplySnakeCaseNaming();
    }
}
