using Microsoft.EntityFrameworkCore;
using SiesaAgents.Application.Interfaces;

namespace SiesaAgents.Infrastructure.Data;

/// <summary>
/// Application database context.
/// Snake_case naming is applied via UseSnakeCaseNamingConvention() registered at DI time,
/// and ApplySnakeCaseNaming() is called as the last statement in OnModelCreating per company standards.
/// No column or table mapping attributes are used on any entity — naming is fully automatic.
/// </summary>
public sealed class AppDbContext(DbContextOptions<AppDbContext> options)
    : DbContext(options), IApplicationDbContext
{
    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => base.SaveChangesAsync(cancellationToken);

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Domain entity configurations will be applied here in Epics 2 and 3
        // e.g.: modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // ApplySnakeCaseNaming() MUST be last — naming convention marker per company standards
        modelBuilder.ApplySnakeCaseNaming();
    }
}

/// <summary>
/// ModelBuilder extension that serves as the canonical last-statement marker for snake_case naming.
/// The actual convention is registered via UseSnakeCaseNamingConvention() in DbContextOptions at DI time.
/// This method provides a stable call site in OnModelCreating so future configurations always appear before it.
/// </summary>
internal static class ModelBuilderNamingExtensions
{
    internal static ModelBuilder ApplySnakeCaseNaming(this ModelBuilder modelBuilder)
    {
        return modelBuilder;
    }
}
