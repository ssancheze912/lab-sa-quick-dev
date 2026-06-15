using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data.Extensions;

/// <summary>
/// Converts every table, schema, column, primary-key, foreign-key and index
/// name produced by EF Core into <c>snake_case</c>. This is the company-wide
/// convention enforced as the LAST call inside <see cref="DbContext.OnModelCreating"/>.
/// </summary>
public static class ModelBuilderSnakeCaseExtensions
{
    /// <summary>
    /// Walks every entity in the model and rewrites table/column/key/index
    /// names to snake_case. Idempotent: snake_case names pass through unchanged.
    /// </summary>
    public static ModelBuilder ApplySnakeCaseNaming(this ModelBuilder modelBuilder)
    {
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            var tableName = entity.GetTableName();
            if (tableName is not null)
            {
                entity.SetTableName(tableName.ToSnakeCase());
            }

            var schema = entity.GetSchema();
            if (schema is not null)
            {
                entity.SetSchema(schema.ToSnakeCase());
            }

            foreach (var property in entity.GetProperties())
            {
                var columnName = property.GetColumnName();
                if (columnName is not null)
                {
                    property.SetColumnName(columnName.ToSnakeCase());
                }
            }

            foreach (var key in entity.GetKeys())
            {
                var name = key.GetName();
                if (name is not null)
                {
                    key.SetName(name.ToSnakeCase());
                }
            }

            foreach (var fk in entity.GetForeignKeys())
            {
                var name = fk.GetConstraintName();
                if (name is not null)
                {
                    fk.SetConstraintName(name.ToSnakeCase());
                }
            }

            foreach (var index in entity.GetIndexes())
            {
                var name = index.GetDatabaseName();
                if (name is not null)
                {
                    index.SetDatabaseName(name.ToSnakeCase());
                }
            }
        }

        return modelBuilder;
    }

    /// <summary>
    /// Converts a PascalCase / camelCase / acronym-bearing identifier into
    /// snake_case (e.g. <c>NITNumber</c> → <c>nit_number</c>,
    /// <c>IX_Contactos_ClienteId</c> → <c>ix_contactos_cliente_id</c>).
    /// Already-snake_case input is returned lowercased.
    /// </summary>
    public static string ToSnakeCase(this string input)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return input;
        }

        // Insert "_" between a lowercase/digit and an uppercase letter.
        var step1 = Regex.Replace(input, "(?<=[a-z0-9])([A-Z])", "_$1");
        // Insert "_" between consecutive uppercase letters when the next pair
        // starts a new word (acronym boundary: "NITNumber" → "NIT_Number").
        var step2 = Regex.Replace(step1, "(?<=[A-Z])([A-Z][a-z])", "_$1");
        // Collapse repeated underscores produced by names that already mixed
        // PascalCase and explicit underscores (e.g. "IX_ClienteId").
        var step3 = Regex.Replace(step2, "_+", "_");
        return step3.ToLowerInvariant();
    }
}
