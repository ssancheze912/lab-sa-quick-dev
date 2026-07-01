using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

/// <summary>
/// Applies snake_case naming convention to all EF-managed tables and columns.
/// Company standard: no built-in EF Core/Npgsql equivalent exists, so this is a
/// project-owned ModelBuilder extension (avoids the EFCore.NamingConventions dependency).
/// Must be called as the LAST statement in AppDbContext.OnModelCreating().
/// </summary>
public static class ModelBuilderExtensions
{
    private static readonly Regex SnakeCaseRegex = new("([a-z0-9])([A-Z])", RegexOptions.Compiled);

    public static void ApplySnakeCaseNaming(this ModelBuilder modelBuilder)
    {
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            entity.SetTableName(ToSnakeCase(entity.GetTableName()));

            foreach (var property in entity.GetProperties())
            {
                property.SetColumnName(ToSnakeCase(property.GetColumnName()));
            }
        }
    }

    private static string? ToSnakeCase(string? value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return value;
        }

        return SnakeCaseRegex.Replace(value, "$1_$2").ToLowerInvariant();
    }
}
