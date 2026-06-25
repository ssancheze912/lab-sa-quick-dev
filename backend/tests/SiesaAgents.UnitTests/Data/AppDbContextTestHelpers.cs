using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Data;

// -------------------------------------------------------------------------
// Test-only entity types used as fixtures for model-building tests
// -------------------------------------------------------------------------

/// <summary>A PascalCase entity to verify snake_case table and column name conversion.</summary>
internal class TestPascalCaseEntity
{
    public int Id { get; set; }
    public string SomeName { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

/// <summary>An entity name with acronym to verify consecutive-uppercase handling.</summary>
internal class TestAPIResponse
{
    public int Id { get; set; }
}

/// <summary>An already-lowercase entity name to verify passthrough behavior.</summary>
#pragma warning disable IDE1006 // Naming Styles — intentional lowercase for test
internal class alreadylowercase
{
    public int Id { get; set; }
}
#pragma warning restore IDE1006

// -------------------------------------------------------------------------
// Test-only AppDbContext variants that register test entities
// -------------------------------------------------------------------------

internal class AppDbContextWithTestEntity(DbContextOptions<AppDbContextWithTestEntity> options)
    : DbContext(options)
{
    public DbSet<TestPascalCaseEntity> TestEntities => Set<TestPascalCaseEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<TestPascalCaseEntity>();
        // Apply the same snake_case logic as the real AppDbContext
        AppDbContextSnakeCaseHelper.ApplySnakeCaseNaming(modelBuilder);
    }
}

internal class AppDbContextWithAcronymEntity(DbContextOptions<AppDbContextWithAcronymEntity> options)
    : DbContext(options)
{
    public DbSet<TestAPIResponse> ApiResponses => Set<TestAPIResponse>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<TestAPIResponse>();
        AppDbContextSnakeCaseHelper.ApplySnakeCaseNaming(modelBuilder);
    }
}

internal class AppDbContextWithLowercaseEntity(DbContextOptions<AppDbContextWithLowercaseEntity> options)
    : DbContext(options)
{
    public DbSet<alreadylowercase> LowercaseEntities => Set<alreadylowercase>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<alreadylowercase>();
        AppDbContextSnakeCaseHelper.ApplySnakeCaseNaming(modelBuilder);
    }
}

/// <summary>
/// Mirrors the exact snake_case logic from AppDbContext so tests can use the same algorithm
/// without relying on internal access to the private static method.
/// </summary>
internal static class AppDbContextSnakeCaseHelper
{
    internal static void ApplySnakeCaseNaming(ModelBuilder modelBuilder)
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

        string snakeCase = System.Text.RegularExpressions.Regex.Replace(name, @"([a-z0-9])([A-Z])", "$1_$2");
        snakeCase = System.Text.RegularExpressions.Regex.Replace(snakeCase, @"([A-Z]+)([A-Z][a-z])", "$1_$2");
        return snakeCase.ToLowerInvariant();
    }
}
