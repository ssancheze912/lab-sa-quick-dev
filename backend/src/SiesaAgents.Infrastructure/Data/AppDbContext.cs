using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // No DbSet<T> here — domain entities added in Epic 2 & 3

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        ApplySnakeCaseNaming(modelBuilder);
    }

    // Apply snake_case naming to all tables, columns, keys and indexes
    // using native EF Core 10 Metadata API — no external package required.
    private static void ApplySnakeCaseNaming(ModelBuilder modelBuilder)
    {
        foreach (IMutableEntityType entity in modelBuilder.Model.GetEntityTypes())
        {
            entity.SetTableName(ToSnakeCase(entity.GetTableName() ?? entity.ClrType.Name));

            foreach (IMutableProperty property in entity.GetProperties())
            {
                property.SetColumnName(ToSnakeCase(property.GetColumnName()));
            }

            foreach (IMutableKey key in entity.GetKeys())
            {
                key.SetName(ToSnakeCase(key.GetName() ?? string.Empty));
            }

            foreach (IMutableForeignKey fk in entity.GetForeignKeys())
            {
                fk.SetConstraintName(ToSnakeCase(fk.GetConstraintName() ?? string.Empty));
            }

            foreach (IMutableIndex index in entity.GetIndexes())
            {
                index.SetDatabaseName(ToSnakeCase(index.GetDatabaseName() ?? string.Empty));
            }
        }
    }

    private static string ToSnakeCase(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            return name;

        string snakeCase = Regex.Replace(name, @"([a-z0-9])([A-Z])", "$1_$2");
        snakeCase = Regex.Replace(snakeCase, @"([A-Z]+)([A-Z][a-z])", "$1_$2");
        return snakeCase.ToLowerInvariant();
    }
}
