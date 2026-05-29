using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace SiesaAgents.Infrastructure.Extensions;

public static partial class ModelBuilderExtensions
{
    /// <summary>
    /// Applies snake_case naming conventions to all entity table and column names.
    /// Replaces EFCore.NamingConventions package's ApplySnakeCaseNaming() extension.
    /// Company standard: all database identifiers must be snake_case.
    /// </summary>
    public static ModelBuilder ApplySnakeCaseNaming(this ModelBuilder modelBuilder)
    {
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            // Convert table name
            if (entity.GetTableName() is { } tableName)
            {
                entity.SetTableName(ToSnakeCase(tableName));
            }

            // Convert column names
            foreach (var property in entity.GetProperties())
            {
                var columnName = property.GetColumnName();
                if (!string.IsNullOrEmpty(columnName))
                {
                    property.SetColumnName(ToSnakeCase(columnName));
                }
            }

            // Convert key names
            foreach (var key in entity.GetKeys())
            {
                if (key.GetName() is { } keyName)
                {
                    key.SetName(ToSnakeCase(keyName));
                }
            }

            // Convert foreign key constraint names
            foreach (var fk in entity.GetForeignKeys())
            {
                if (fk.GetConstraintName() is { } constraintName)
                {
                    fk.SetConstraintName(ToSnakeCase(constraintName));
                }
            }

            // Convert index names
            foreach (var index in entity.GetIndexes())
            {
                if (index.GetDatabaseName() is { } indexName)
                {
                    index.SetDatabaseName(ToSnakeCase(indexName));
                }
            }
        }

        return modelBuilder;
    }

    private static string ToSnakeCase(string name)
    {
        if (string.IsNullOrEmpty(name))
            return name;

        return SnakeCaseRegex().Replace(name, "$1_$2").ToLowerInvariant();
    }

    [GeneratedRegex("([a-z0-9])([A-Z])")]
    private static partial Regex SnakeCaseRegex();
}
