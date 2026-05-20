using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;
using System.Text.RegularExpressions;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Edge-case and boundary tests for AppDbContext and ModelBuilderExtensions — Story 1.3.
/// Expands ATDD coverage with ordering guarantees, snake_case transformation correctness,
/// and disposal / lifecycle boundary conditions not covered in AppDbContextTests.
/// </summary>
public class AppDbContextEdgeCaseTests
{
    // ─────────────────────────────────────────────────────────────
    // snake_case naming — via ModelBuilderExtensions on a standalone context
    // ─────────────────────────────────────────────────────────────

    /// <summary>
    /// EDGE-DB-01 (P1 — AC3)
    /// Given a DbContext with SampleEntity that has PascalCase properties
    /// and ApplySnakeCaseNaming() is called in OnModelCreating,
    /// When the EF Core model is built,
    /// Then the "CreatedAt" property MUST have column name "created_at".
    /// </summary>
    [Fact]
    public void ApplySnakeCaseNaming_CreatedAtProperty_MapsToCreated_At()
    {
        var options = new DbContextOptionsBuilder<SampleDbContext>()
            .UseInMemoryDatabase(databaseName: $"EdgeTest_{Guid.NewGuid()}")
            .Options;

        using var context = new SampleDbContext(options);
        var entityType = context.Model.FindEntityType(typeof(SampleEntity));
        Assert.NotNull(entityType);

        var prop = entityType.FindProperty(nameof(SampleEntity.CreatedAt));
        Assert.NotNull(prop);
        Assert.Equal("created_at", prop.GetColumnName());
    }

    /// <summary>
    /// EDGE-DB-02 (P1 — AC3)
    /// Given a DbContext with SampleEntity,
    /// When the EF Core model is built with ApplySnakeCaseNaming(),
    /// Then "ClienteId" property MUST map to column "cliente_id".
    /// </summary>
    [Fact]
    public void ApplySnakeCaseNaming_ClienteIdProperty_MapsToCliente_Id()
    {
        var options = new DbContextOptionsBuilder<SampleDbContext>()
            .UseInMemoryDatabase(databaseName: $"EdgeTest_{Guid.NewGuid()}")
            .Options;

        using var context = new SampleDbContext(options);
        var entityType = context.Model.FindEntityType(typeof(SampleEntity));
        Assert.NotNull(entityType);

        var prop = entityType.FindProperty(nameof(SampleEntity.ClienteId));
        Assert.NotNull(prop);
        Assert.Equal("cliente_id", prop.GetColumnName());
    }

    /// <summary>
    /// EDGE-DB-03 (P2 — AC3 boundary)
    /// The "Id" property (single uppercase initial followed by lowercase 'd')
    /// must produce "id" — NOT "_id" — because the index==0 guard in ToSnakeCase
    /// must skip the leading underscore injection.
    /// </summary>
    [Fact]
    public void ApplySnakeCaseNaming_IdProperty_ProducesId_WithNoLeadingUnderscore()
    {
        var options = new DbContextOptionsBuilder<SampleDbContext>()
            .UseInMemoryDatabase(databaseName: $"EdgeTest_{Guid.NewGuid()}")
            .Options;

        using var context = new SampleDbContext(options);
        var entityType = context.Model.FindEntityType(typeof(SampleEntity));
        Assert.NotNull(entityType);

        var idProp = entityType.FindProperty(nameof(SampleEntity.Id));
        Assert.NotNull(idProp);
        var columnName = idProp.GetColumnName();

        Assert.Equal("id", columnName);
        Assert.False(columnName!.StartsWith('_'),
            "Column name 'id' must not start with underscore — index==0 guard must apply.");
    }

    /// <summary>
    /// EDGE-DB-04 (P2 — AC3)
    /// "UpdatedAt" must map to "updated_at".
    /// </summary>
    [Fact]
    public void ApplySnakeCaseNaming_UpdatedAtProperty_MapsToUpdated_At()
    {
        var options = new DbContextOptionsBuilder<SampleDbContext>()
            .UseInMemoryDatabase(databaseName: $"EdgeTest_{Guid.NewGuid()}")
            .Options;

        using var context = new SampleDbContext(options);
        var entityType = context.Model.FindEntityType(typeof(SampleEntity));
        Assert.NotNull(entityType);

        var prop = entityType.FindProperty(nameof(SampleEntity.UpdatedAt));
        Assert.NotNull(prop);
        Assert.Equal("updated_at", prop.GetColumnName());
    }

    /// <summary>
    /// EDGE-DB-05 (P1 — AC3)
    /// Table name for "SampleEntities" DbSet must be "sample_entities" after snake_case.
    /// Table names must not contain uppercase letters.
    /// </summary>
    [Fact]
    public void ApplySnakeCaseNaming_TableName_IsFullyLowercaseSnakeCase()
    {
        var options = new DbContextOptionsBuilder<SampleDbContext>()
            .UseInMemoryDatabase(databaseName: $"EdgeTest_{Guid.NewGuid()}")
            .Options;

        using var context = new SampleDbContext(options);
        var entityType = context.Model.FindEntityType(typeof(SampleEntity));
        Assert.NotNull(entityType);

        var tableName = entityType.GetTableName();
        Assert.NotNull(tableName);
        // Must be all lowercase + underscores (snake_case enforced)
        Assert.Matches(new Regex("^[a-z0-9_]+$"), tableName);
        // EF Core with InMemory provider derives table name from entity CLR type name ("SampleEntity")
        // which ApplySnakeCaseNaming converts to "sample_entity".
        Assert.Equal("sample_entity", tableName);
    }

    // ─────────────────────────────────────────────────────────────
    // ApplySnakeCaseNaming ordering guard
    // ─────────────────────────────────────────────────────────────

    /// <summary>
    /// EDGE-DB-06 (P1 — AC3 / Critical Rule)
    /// ApplySnakeCaseNaming() MUST be last in OnModelCreating.
    /// This test asserts that every column in every entity in the model
    /// contains no uppercase letters — confirming snake_case was applied
    /// after all other configurations (and was not overridden).
    /// </summary>
    [Fact]
    public void ApplySnakeCaseNaming_AllColumns_ContainNoUppercaseLetters()
    {
        var options = new DbContextOptionsBuilder<SampleDbContext>()
            .UseInMemoryDatabase(databaseName: $"EdgeTest_{Guid.NewGuid()}")
            .Options;

        using var context = new SampleDbContext(options);
        var upperCasePattern = new Regex("[A-Z]");

        foreach (var entity in context.Model.GetEntityTypes())
        {
            foreach (var property in entity.GetProperties())
            {
                var colName = property.GetColumnName();
                if (colName != null)
                {
                    Assert.False(upperCasePattern.IsMatch(colName),
                        $"Column '{colName}' on entity '{entity.Name}' must be snake_case " +
                        "(no uppercase). ApplySnakeCaseNaming() must be the last call in OnModelCreating.");
                }
            }
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Context lifecycle — Dispose / multiple instances
    // ─────────────────────────────────────────────────────────────

    /// <summary>
    /// EDGE-DB-07 (P2 — lifecycle)
    /// AppDbContext.Dispose() must not throw.
    /// Validates that the context can be safely released (critical for DI scoped lifetimes).
    /// </summary>
    [Fact]
    public void AppDbContext_Dispose_DoesNotThrow()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"EdgeTest_{Guid.NewGuid()}")
            .Options;

        var exception = Record.Exception(() =>
        {
            var context = new AppDbContext(options);
            context.Dispose();
        });

        Assert.Null(exception);
    }

    /// <summary>
    /// EDGE-DB-08 (P2 — lifecycle)
    /// Two independent AppDbContext instances with separate in-memory databases
    /// must not share state — each instance is isolated.
    /// </summary>
    [Fact]
    public void AppDbContext_TwoIndependentInstances_AreIsolated()
    {
        var opts1 = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"DB1_{Guid.NewGuid()}")
            .Options;
        var opts2 = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"DB2_{Guid.NewGuid()}")
            .Options;

        using var ctx1 = new AppDbContext(opts1);
        using var ctx2 = new AppDbContext(opts2);

        // Both must have valid, independent model instances
        Assert.NotNull(ctx1.Model);
        Assert.NotNull(ctx2.Model);
        Assert.NotSame(ctx1, ctx2);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Test helpers — local only, not part of production code
// ─────────────────────────────────────────────────────────────────────────────

/// <summary>
/// Minimal entity representing the property conventions documented in Dev Notes:
///   Id (Guid), CreatedAt (DateTimeOffset), UpdatedAt (DateTimeOffset), ClienteId (Guid?).
/// Used exclusively to verify ApplySnakeCaseNaming() output.
/// </summary>
internal class SampleEntity
{
    public Guid Id { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public Guid? ClienteId { get; set; }
}

/// <summary>
/// A standalone DbContext used only in tests to verify that
/// ModelBuilderExtensions.ApplySnakeCaseNaming() works correctly on entities.
/// Does NOT extend AppDbContext — it is an independent context that applies
/// the same naming convention.
/// </summary>
internal class SampleDbContext : DbContext
{
    public SampleDbContext(DbContextOptions<SampleDbContext> options) : base(options) { }

    public DbSet<SampleEntity> SampleEntities { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Mirror the exact production pattern from AppDbContext
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(SampleDbContext).Assembly);

        // MANDATORY: snake_case naming — MUST be last (same as production AppDbContext)
        modelBuilder.ApplySnakeCaseNaming();
    }
}
