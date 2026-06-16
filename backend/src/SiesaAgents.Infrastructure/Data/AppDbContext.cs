using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // Compiled regexes for snake_case conversion (compiled once per AppDomain at startup).
    private static readonly Regex _acronymBoundaryRegex =
        new(@"([A-Z]+)([A-Z][a-z])", RegexOptions.Compiled);
    private static readonly Regex _camelBoundaryRegex =
        new(@"(?<=[a-z0-9])([A-Z])", RegexOptions.Compiled);

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
        // Pass 1: Insert underscore between consecutive uppercase sequences and lowercase
        //         e.g., HTMLParser -> HTML_Parser (handles leading-uppercase acronyms)
        var step1 = _acronymBoundaryRegex.Replace(name, "$1_$2");
        // Pass 2: Insert underscore before uppercase letters preceded by lowercase letters or digits
        //         e.g., parse_Html -> parse_html
        var result = _camelBoundaryRegex.Replace(step1, "_$1");
        return result.ToLowerInvariant();
    }
}
