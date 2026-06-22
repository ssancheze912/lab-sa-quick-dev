using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace SiesaAgents.Infrastructure.Data;

/// <summary>
/// Extension methods for ModelBuilder to apply PostgreSQL naming conventions.
/// </summary>
public static class ModelBuilderExtensions
{
    private static readonly Regex UpperCasePattern = new(@"([A-Z])", RegexOptions.Compiled);

    /// <summary>
    /// Applies snake_case naming convention to all tables and columns.
    /// MUST be called last in OnModelCreating after all other configurations.
    /// </summary>
    public static ModelBuilder ApplySnakeCaseNaming(this ModelBuilder modelBuilder)
    {
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            // Convert table name to snake_case
            var tableName = entity.GetTableName();
            if (tableName != null)
            {
                entity.SetTableName(ToSnakeCase(tableName));
            }

            // Convert column names to snake_case
            foreach (var property in entity.GetProperties())
            {
                var columnName = property.GetColumnName();
                if (columnName != null)
                {
                    property.SetColumnName(ToSnakeCase(columnName));
                }
            }

            // Convert key names to snake_case
            foreach (var key in entity.GetKeys())
            {
                key.SetName(ToSnakeCase(key.GetName() ?? string.Empty));
            }

            // Convert foreign key names to snake_case
            foreach (var fk in entity.GetForeignKeys())
            {
                fk.SetConstraintName(ToSnakeCase(fk.GetConstraintName() ?? string.Empty));
            }

            // Convert index names to snake_case
            foreach (var index in entity.GetIndexes())
            {
                index.SetDatabaseName(ToSnakeCase(index.GetDatabaseName() ?? string.Empty));
            }
        }

        return modelBuilder;
    }

    private static string ToSnakeCase(string name)
    {
        if (string.IsNullOrEmpty(name))
            return name;

        // Insert underscore before uppercase letters (except the first character)
        var result = UpperCasePattern.Replace(name, match =>
        {
            var index = match.Index;
            return index > 0 ? "_" + match.Value : match.Value;
        });

        return result.ToLowerInvariant();
    }
}
