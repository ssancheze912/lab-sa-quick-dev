using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace SiesaAgents.Infrastructure.Data;

/// <summary>
/// In-house naming convention that rewrites every EF Core managed identifier
/// (tables, columns, indexes, foreign-key constraints) to lowercase snake_case
/// following company database conventions.
///
/// MUST be the last call inside <c>OnModelCreating</c> so that prior
/// <c>HasDefaultSchema</c> / <c>ApplyConfigurationsFromAssembly</c> instructions
/// are rewritten and not overwritten.
/// </summary>
public static class SnakeCaseNamingConvention
{
    private static readonly Regex LowerOrDigitToUpper =
        new("([a-z0-9])([A-Z])", RegexOptions.Compiled);

    private static readonly Regex AcronymBoundary =
        new("([A-Z]+)([A-Z][a-z])", RegexOptions.Compiled);

    /// <summary>
    /// Converts a PascalCase or camelCase identifier to lowercase snake_case.
    /// Handles acronyms (<c>APIKey</c> → <c>api_key</c>, <c>HTTPClient</c> → <c>http_client</c>,
    /// <c>ClienteID</c> → <c>cliente_id</c>) and returns null/empty inputs unchanged.
    /// </summary>
    public static string ToSnakeCase(string input)
    {
        if (string.IsNullOrEmpty(input))
        {
            return input;
        }

        var step1 = LowerOrDigitToUpper.Replace(input, "$1_$2");
        var step2 = AcronymBoundary.Replace(step1, "$1_$2");
        return step2.ToLowerInvariant();
    }

    /// <summary>
    /// Rewrites every entity table name, column name, index name and FK constraint
    /// name on the provided <see cref="ModelBuilder"/> to lowercase snake_case.
    /// Indexes use the <c>ix_</c> (or <c>uk_</c> when unique) prefix; foreign keys
    /// use <c>fk_{dependent}_{principal}</c>.
    /// </summary>
    public static void ApplySnakeCaseNaming(this ModelBuilder modelBuilder)
    {
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            var tableName = entity.GetTableName();
            if (!string.IsNullOrEmpty(tableName))
            {
                entity.SetTableName(ToSnakeCase(tableName));
            }

            var storeObject = StoreObjectIdentifier.Create(entity, StoreObjectType.Table);

            foreach (var property in entity.GetProperties())
            {
                var columnName = storeObject.HasValue
                    ? property.GetColumnName(storeObject.Value)
                    : property.GetColumnName();

                if (!string.IsNullOrEmpty(columnName))
                {
                    property.SetColumnName(ToSnakeCase(columnName));
                }
            }

            foreach (var key in entity.GetKeys())
            {
                var keyName = key.GetName();
                if (!string.IsNullOrEmpty(keyName))
                {
                    key.SetName(ToSnakeCase(keyName));
                }
            }

            foreach (var index in entity.GetIndexes())
            {
                var table = entity.GetTableName() ?? string.Empty;
                var columns = string.Join(
                    "_",
                    index.Properties.Select(p => ToSnakeCase(p.Name)));
                var prefix = index.IsUnique ? "uk" : "ix";
                index.SetDatabaseName($"{prefix}_{table}_{columns}");
            }

            foreach (var fk in entity.GetForeignKeys())
            {
                var dependent = entity.GetTableName() ?? string.Empty;
                var principal = fk.PrincipalEntityType.GetTableName() ?? string.Empty;
                fk.SetConstraintName($"fk_{dependent}_{principal}");
            }
        }
    }
}
