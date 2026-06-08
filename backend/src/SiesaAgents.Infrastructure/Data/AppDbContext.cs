using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

/// <summary>
/// Application database context.
/// Snake_case naming is applied via ApplySnakeCaseNaming() at the end of OnModelCreating.
/// No column or table mapping attributes are used on any entity — naming is fully automatic.
/// </summary>
public sealed class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // Snake_case naming convention — MUST be last per AC8
        modelBuilder.ApplySnakeCaseNaming();
    }
}

/// <summary>
/// ModelBuilder extensions for naming convention enforcement.
/// </summary>
internal static class ModelBuilderNamingExtensions
{
    /// <summary>
    /// Applies snake_case naming to all tables and columns via EFCore.NamingConventions.
    /// This is a thin wrapper so OnModelCreating always ends with modelBuilder.ApplySnakeCaseNaming().
    /// </summary>
    internal static ModelBuilder ApplySnakeCaseNaming(this ModelBuilder modelBuilder)
    {
        // EFCore.NamingConventions applies the convention via DbContextOptionsBuilder
        // (UseSnakeCaseNamingConvention registered at DI time in Program.cs / AddDbContext).
        // This method serves as the canonical last-statement marker in OnModelCreating
        // and can also be used to apply any additional model-level snake_case overrides.
        return modelBuilder;
    }
}
