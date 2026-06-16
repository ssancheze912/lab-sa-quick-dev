using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Clientes.Entities;
using System.Text.RegularExpressions;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // Epic 2: ClienteEntity
    public DbSet<ClienteEntity> Clientes => Set<ClienteEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply entity type configurations from Infrastructure assembly
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
