using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Migrations.Internal;

// Subclassing the Npgsql internal history repository is the documented escape hatch
// for renaming the EF Core bookkeeping table/columns. EF1001 is suppressed locally
// because there is no public API for this in EF Core 10.
#pragma warning disable EF1001

namespace SiesaAgents.Infrastructure.Data;

/// <summary>
/// Custom EF Core history repository that forces the migrations bookkeeping
/// table and its two columns to use lower <c>snake_case</c> identifiers, in
/// alignment with company DB conventions (PostgreSQL — Story 1.3 AC #1, AC #4).
///
/// The default <see cref="NpgsqlHistoryRepository"/> creates
/// <c>"__EFMigrationsHistory"</c> with PascalCase columns
/// (<c>"MigrationId"</c>, <c>"ProductVersion"</c>). Those identifiers live
/// OUTSIDE <see cref="Microsoft.EntityFrameworkCore.DbContext.OnModelCreating(Microsoft.EntityFrameworkCore.ModelBuilder)"/>
/// and are therefore NOT touched by <c>ApplySnakeCaseNaming()</c>.
///
/// This subclass overrides <see cref="HistoryRepository.ConfigureTable"/> to
/// rename the two known columns. The table name itself is renamed at DI
/// registration time via <c>npg.MigrationsHistoryTable("__ef_migrations_history")</c>.
/// </summary>
public class SnakeCaseNpgsqlHistoryRepository(HistoryRepositoryDependencies dependencies)
    : NpgsqlHistoryRepository(dependencies)
{
    protected override void ConfigureTable(EntityTypeBuilder<HistoryRow> history)
    {
        base.ConfigureTable(history);

        // EF Core's HistoryRow has exactly two properties — rename both to snake_case.
        history.Property(h => h.MigrationId).HasColumnName("migration_id");
        history.Property(h => h.ProductVersion).HasColumnName("product_version");
    }
}
