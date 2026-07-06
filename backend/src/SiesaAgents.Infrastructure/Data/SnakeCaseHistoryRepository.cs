using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Migrations.Internal;

namespace SiesaAgents.Infrastructure.Data;

/// <summary>
/// Renames the EF Core migrations history table's columns to snake_case
/// (<c>migration_id</c>, <c>product_version</c>). The table itself is not part of
/// <see cref="AppDbContext.OnModelCreating"/>'s model (it is built internally by EF Core's
/// migrations infrastructure), so <c>ApplySnakeCaseNaming()</c> never sees it — this
/// repository is the supported extension point for customizing it. The table name is set
/// to <c>__ef_migrations_history</c> via <c>NpgsqlDbContextOptionsBuilder.MigrationsHistoryTable</c>
/// in Program.cs; this class only renames the two columns.
/// </summary>
#pragma warning disable EF1001 // NpgsqlHistoryRepository is EF Core's documented extension point for this exact customization.
public class SnakeCaseHistoryRepository(HistoryRepositoryDependencies dependencies)
    : NpgsqlHistoryRepository(dependencies)
{
    protected override void ConfigureTable(EntityTypeBuilder<HistoryRow> history)
    {
        base.ConfigureTable(history);

        history.Property(h => h.MigrationId).HasColumnName("migration_id");
        history.Property(h => h.ProductVersion).HasColumnName("product_version");
    }
}
#pragma warning restore EF1001
