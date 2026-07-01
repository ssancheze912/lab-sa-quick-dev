using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Migrations.Internal;

namespace SiesaAgents.Infrastructure.Data;

/// <summary>
/// Overrides the EF Core migrations history table/column names with the snake_case
/// convention (company standard). EF Core builds `__EFMigrationsHistory` internally via
/// `HistoryRepository`, bypassing `AppDbContext.OnModelCreating` — so `ApplySnakeCaseNaming()`
/// cannot reach it. This repository is registered in place of the default `IHistoryRepository`
/// to keep the migrations bookkeeping table consistent with the rest of the schema.
///
/// `MigrationIdColumnName`/`ProductVersionColumnName` alone are not enough: EF's base
/// `ConfigureTable` never calls `.HasColumnName()`, it relies on the default convention
/// (CLR property name). `ConfigureTable` must be overridden to explicitly map columns.
/// </summary>
#pragma warning disable EF1001 // NpgsqlHistoryRepository is internal API; no public extension point exists to rename history columns.
public class SnakeCaseNpgsqlHistoryRepository(HistoryRepositoryDependencies dependencies)
    : NpgsqlHistoryRepository(dependencies)
{
#pragma warning restore EF1001
    protected override string TableName => "__ef_migrations_history";

    protected override string MigrationIdColumnName => "migration_id";

    protected override string ProductVersionColumnName => "product_version";

    protected override void ConfigureTable(EntityTypeBuilder<HistoryRow> history)
    {
        base.ConfigureTable(history);

        history.Property(h => h.MigrationId).HasColumnName(MigrationIdColumnName);
        history.Property(h => h.ProductVersion).HasColumnName(ProductVersionColumnName);
    }
}
