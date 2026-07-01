using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Infrastructure.Data;

/// <summary>
/// Root EF Core DbContext for the SiesaAgents backend.
///
/// Scope note:
///   - Story 1.3 established the empty <c>InitialCreate</c> migration + snake_case history table.
///   - Story 2.1 (this story) adds <c>DbSet&lt;ClienteEntity&gt;</c> and the <c>clientes</c> table.
///   - <c>contactos</c> remains scheduled for Epic 3 Story 3.1.
///
/// Naming convention: snake_case is applied globally via
/// <c>DbContextOptionsBuilder.UseSnakeCaseNamingConvention()</c> configured at DI registration
/// (see <c>Program.cs</c>). The EF-internal migration history table is explicitly renamed to
/// <c>__ef_migrations_history</c> (with snake_case columns) so the entire persisted schema
/// follows the company database standard.
/// </summary>
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    /// <summary>
    /// Well-known snake_case name for the EF Core migrations history table.
    /// Kept public so integration tests and DI registration can reference the exact same value.
    /// </summary>
    public const string MigrationsHistoryTableName = "__ef_migrations_history";

    public DbSet<ClienteEntity> Clientes => Set<ClienteEntity>();

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        base.OnConfiguring(optionsBuilder);

        // Ensure the EF migrations history table itself is created with the snake_case
        // company-standard name, regardless of who built the DbContextOptions. This runs
        // even when tests build their own options via `UseNpgsql(...).UseSnakeCaseNamingConvention()`.
        // We look up the relational extension (NpgsqlOptionsExtension inherits from it) so
        // we don't need a hard reference to the internal Npgsql extension type.
        var relationalExt = optionsBuilder.Options.Extensions
            .OfType<RelationalOptionsExtension>()
            .FirstOrDefault();

        if (relationalExt is not null && !string.IsNullOrEmpty(relationalExt.ConnectionString))
        {
            optionsBuilder.UseNpgsql(
                relationalExt.ConnectionString,
                npgsql => npgsql.MigrationsHistoryTable(MigrationsHistoryTableName));
        }
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Auto-discover IEntityTypeConfiguration<> classes under Data/Configurations/.
        builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
