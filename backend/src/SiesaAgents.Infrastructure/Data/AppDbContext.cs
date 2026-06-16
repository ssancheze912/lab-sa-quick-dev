using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // No DbSet<> properties in this story.
    // ClienteEntity and ContactoEntity DbSets are added in Epics 2 and 3.

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply entity type configurations (currently none — added per epic)
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // MUST be LAST: automatic snake_case naming for all tables and columns
        // Converts PascalCase C# names to snake_case SQL names per company standards.
        // No manual [Column] or [Table] attributes needed on any entity.
        ApplySnakeCaseNaming(modelBuilder);
    }

    private static void ApplySnakeCaseNaming(ModelBuilder modelBuilder)
    {
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            var tableName = entity.GetTableName();
            if (tableName is not null)
                entity.SetTableName(ToSnakeCase(tableName));

            foreach (var property in entity.GetProperties())
            {
                var columnName = property.GetColumnName();
                if (columnName is not null)
                    property.SetColumnName(ToSnakeCase(columnName));
            }
        }
    }

    private static string ToSnakeCase(string name)
    {
        // Insert underscore before uppercase letters preceded by lowercase letters or digits
        var result = Regex.Replace(name, @"(?<=[a-z0-9])([A-Z])", "_$1");
        return result.ToLowerInvariant();
    }
}
