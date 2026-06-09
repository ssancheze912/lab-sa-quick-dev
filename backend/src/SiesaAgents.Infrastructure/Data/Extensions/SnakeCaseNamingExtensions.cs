using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace SiesaAgents.Infrastructure.Data.Extensions;

/// <summary>
/// In-house snake_case naming extension as required by company standards.
///
/// Although <c>EFCore.NamingConventions</c> is registered via
/// <c>UseSnakeCaseNamingConvention()</c> in <see cref="DependencyInjection.AddInfrastructure"/>
/// (so the convention rewrites every relational name at model finalization),
/// company standards mandate the literal API call <c>modelBuilder.ApplySnakeCaseNaming()</c>
/// inside <c>OnModelCreating</c> as the LAST statement.
///
/// This extension provides that exact public surface. It walks every entity type,
/// property, key, foreign key, and index in the model and rewrites their relational
/// names to snake_case — making the call idempotent next to the registered convention
/// (re-applying snake_case to an already-snake_case identifier is a no-op).
/// </summary>
public static class SnakeCaseNamingExtensions
{
    public static void ApplySnakeCaseNaming(this ModelBuilder modelBuilder)
    {
        ArgumentNullException.ThrowIfNull(modelBuilder);

        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            var tableName = entity.GetTableName();
            if (!string.IsNullOrEmpty(tableName))
            {
                entity.SetTableName(ToSnakeCase(tableName));
            }

            foreach (var property in entity.GetProperties())
            {
                var columnName = property.GetColumnName();
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

            foreach (var foreignKey in entity.GetForeignKeys())
            {
                var constraintName = foreignKey.GetConstraintName();
                if (!string.IsNullOrEmpty(constraintName))
                {
                    foreignKey.SetConstraintName(ToSnakeCase(constraintName));
                }
            }

            foreach (var index in entity.GetIndexes())
            {
                var indexName = index.GetDatabaseName();
                if (!string.IsNullOrEmpty(indexName))
                {
                    index.SetDatabaseName(ToSnakeCase(indexName));
                }
            }
        }
    }

    /// <summary>
    /// Converts PascalCase / camelCase identifiers to snake_case.
    /// Already-snake_case input is returned unchanged.
    /// </summary>
    internal static string ToSnakeCase(string input)
    {
        if (string.IsNullOrEmpty(input))
        {
            return input;
        }

        var builder = new StringBuilder(input.Length + 8);
        for (var i = 0; i < input.Length; i++)
        {
            var current = input[i];
            if (char.IsUpper(current))
            {
                if (i > 0
                    && input[i - 1] != '_'
                    && (char.IsLower(input[i - 1])
                        || (i + 1 < input.Length && char.IsLower(input[i + 1]))))
                {
                    builder.Append('_');
                }

                builder.Append(char.ToLowerInvariant(current));
            }
            else
            {
                builder.Append(current);
            }
        }

        return builder.ToString();
    }
}
