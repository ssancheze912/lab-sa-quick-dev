using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data.Conventions;

/// <summary>
/// Enforces PostgreSQL snake_case naming (tables, columns, indexes, foreign keys)
/// across every entity registered on <see cref="ModelBuilder"/>.
///
/// Reference implementation:
///   _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/database-conventions.md §2.1
/// </summary>
public static class SnakeCaseNamingConvention
{
    // Splits PascalCase / camelCase / acronym boundaries:
    //   1. lower→UPPER               (createdAt   → created_At)
    //   2. UPPER→UPPER+lower         (HTTPClient  → HTTP_Client)
    //   3. digit boundaries          (Value1Test  → Value1_Test)
    private static readonly Regex SnakeCaseRegex = new(
        "(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])",
        RegexOptions.Compiled);

    /// <summary>
    /// Converts an identifier (PascalCase, camelCase, acronyms) to snake_case.
    /// Examples: <c>ID → id</c>, <c>APIKey → api_key</c>, <c>HTTPClient → http_client</c>,
    /// <c>CreatedByUserID → created_by_user_id</c>.
    /// </summary>
    public static string ToSnakeCase(string input)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return input;
        }

        return SnakeCaseRegex.Replace(input, "_").ToLowerInvariant();
    }

    /// <summary>
    /// Applies snake_case naming to every table, column, index and foreign-key
    /// constraint in the model. MUST be the LAST call inside
    /// <c>DbContext.OnModelCreating</c> so it observes and rewrites the final
    /// metadata (per test-design-epic-1.md §10 rule #2).
    /// </summary>
    public static void ApplySnakeCaseNaming(this ModelBuilder modelBuilder)
    {
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            // Table
            var tableName = entity.GetTableName();
            if (!string.IsNullOrEmpty(tableName))
            {
                entity.SetTableName(ToSnakeCase(tableName));
            }

            // Columns
            foreach (var property in entity.GetProperties())
            {
                var columnName = property.GetColumnName();
                if (!string.IsNullOrEmpty(columnName))
                {
                    property.SetColumnName(ToSnakeCase(columnName));
                }
            }

            // Keys — primary key constraint name: pk_{table}
            foreach (var key in entity.GetKeys())
            {
                var prefix = key.IsPrimaryKey() ? "pk_" : "ak_";
                var target = ToSnakeCase(entity.GetTableName() ?? entity.ShortName());
                key.SetName($"{prefix}{target}");
            }

            // Indexes — ix_{table}_{columns} or uk_{table}_{columns} when unique.
            foreach (var index in entity.GetIndexes())
            {
                var prefix = index.IsUnique ? "uk_" : "ix_";
                var target = ToSnakeCase(entity.GetTableName() ?? entity.ShortName());
                var columns = string.Join(
                    "_",
                    index.Properties.Select(p => ToSnakeCase(p.GetColumnName() ?? p.Name)));
                index.SetDatabaseName($"{prefix}{target}_{columns}");
            }

            // Foreign keys — fk_{dependent_table}_{principal_table}
            foreach (var foreignKey in entity.GetForeignKeys())
            {
                var dependent = ToSnakeCase(entity.GetTableName() ?? entity.ShortName());
                var principal = ToSnakeCase(
                    foreignKey.PrincipalEntityType.GetTableName()
                        ?? foreignKey.PrincipalEntityType.ShortName());
                foreignKey.SetConstraintName($"fk_{dependent}_{principal}");
            }
        }
    }
}
