using System.Runtime.CompilerServices;
using System.Text;
using Microsoft.EntityFrameworkCore;

[assembly: InternalsVisibleTo("SiesaAgents.UnitTests")]

namespace SiesaAgents.Infrastructure.Data.Extensions;

/// <summary>
/// Converts EF Core's PascalCase default identifier names (tables, columns,
/// keys, foreign keys, indexes) into lower <c>snake_case</c> so generated
/// migrations follow PostgreSQL conventions (company standards — Database
/// Conventions). MUST be invoked as the LAST call in
/// <see cref="DbContext.OnModelCreating(ModelBuilder)"/>.
/// </summary>
public static class ModelBuilderSnakeCaseExtensions
{
    public static ModelBuilder ApplySnakeCaseNaming(this ModelBuilder modelBuilder)
    {
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            var tableName = entity.GetTableName();
            if (tableName is not null)
            {
                entity.SetTableName(ToSnakeCase(tableName));
            }

            foreach (var property in entity.GetProperties())
            {
                property.SetColumnName(ToSnakeCase(property.GetColumnName()));
            }

            foreach (var key in entity.GetKeys())
            {
                var name = key.GetName();
                if (name is not null)
                {
                    key.SetName(ToSnakeCase(name));
                }
            }

            foreach (var foreignKey in entity.GetForeignKeys())
            {
                var name = foreignKey.GetConstraintName();
                if (name is not null)
                {
                    foreignKey.SetConstraintName(ToSnakeCase(name));
                }
            }

            foreach (var index in entity.GetIndexes())
            {
                var name = index.GetDatabaseName();
                if (name is not null)
                {
                    index.SetDatabaseName(ToSnakeCase(name));
                }
            }
        }

        return modelBuilder;
    }

    internal static string ToSnakeCase(string input)
    {
        if (string.IsNullOrEmpty(input)) return input;

        var sb = new StringBuilder(input.Length + 8);
        for (int i = 0; i < input.Length; i++)
        {
            var c = input[i];
            if (i > 0 && char.IsUpper(c) && (char.IsLower(input[i - 1]) || char.IsDigit(input[i - 1])))
            {
                sb.Append('_');
            }
            sb.Append(char.ToLowerInvariant(c));
        }
        return sb.ToString();
    }
}
