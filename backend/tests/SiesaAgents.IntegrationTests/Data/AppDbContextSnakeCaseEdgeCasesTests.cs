using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests.Data;

/// <summary>
/// Edge cases that extend <see cref="AppDbContextSnakeCaseTests"/>:
/// - Multi-segment PascalCase (e.g. <c>UpdatedAtUtc</c> → <c>updated_at_utc</c>).
/// - Multiple entities all converted uniformly.
/// - Foreign-key conventional column names (<c>SomeOtherId</c> → <c>some_other_id</c>).
/// - Production <see cref="AppDbContext"/> with NO domain entities still builds the model
///   without errors (empty <c>Configurations/</c> directory must not break model creation).
/// - Model creation is deterministic across multiple DbContext instances.
/// </summary>
public class AppDbContextSnakeCaseEdgeCasesTests
{
    [Fact]
    public void OnModelCreating_OnVanillaAppDbContext_WithNoEntities_ProducesEmptyModelWithoutErrors()
    {
        // GIVEN: a vanilla production AppDbContext (no domain entities registered — current Story 1.3 state).
        using var ctx = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=localhost;Database=probe;Username=probe;Password=probe")
            .Options);

        // WHEN: the model is materialized.
        var entityTypes = ctx.Model.GetEntityTypes().ToList();

        // THEN: the model builds and is empty (no Cliente / Contacto until Stories 2.1 / 3.1).
        entityTypes.Should().BeEmpty("Story 1.3 introduces no DbSet — domain entities arrive in 2.1 / 3.1");
    }

    [Fact]
    public void OnModelCreating_MultiWordPascalCaseProperty_IsSnakeCased()
    {
        // GIVEN: a probe entity with multi-segment property name.
        using var ctx = new MultiPropDbContext();
        var entityType = ctx.Model.FindEntityType(typeof(MultiPropEntity))!;
        var tableName = entityType.GetTableName();
        var storeObject = StoreObjectIdentifier.Table(tableName!, entityType.GetSchema());

        // WHEN: looking up each property's column name.
        var updatedAtUtc = entityType.FindProperty(nameof(MultiPropEntity.UpdatedAtUtc))!.GetColumnName(storeObject);
        var totalAmount = entityType.FindProperty(nameof(MultiPropEntity.TotalAmount))!.GetColumnName(storeObject);

        // THEN: multi-word PascalCase is converted to snake_case with underscores between every transition.
        updatedAtUtc.Should().Be("updated_at_utc");
        totalAmount.Should().Be("total_amount");
    }

    [Fact]
    public void OnModelCreating_ForeignKeyConventionalProperty_IsSnakeCased()
    {
        // GIVEN: a probe entity that mimics an FK property naming convention (XxxId).
        using var ctx = new MultiPropDbContext();
        var entityType = ctx.Model.FindEntityType(typeof(MultiPropEntity))!;
        var storeObject = StoreObjectIdentifier.Table(entityType.GetTableName()!, entityType.GetSchema());

        // WHEN.
        var ownerId = entityType.FindProperty(nameof(MultiPropEntity.OwnerId))!.GetColumnName(storeObject);

        // THEN: "OwnerId" → "owner_id" (the FK convention applies the same naming rule).
        ownerId.Should().Be("owner_id");
    }

    [Fact]
    public void OnModelCreating_HandlesMultipleEntitiesUniformly_AllTablesAreSnakeCase()
    {
        // GIVEN: two probe entities registered in the same context.
        using var ctx = new MultiPropDbContext();

        // WHEN: enumerating every entity type in the model.
        var allTables = ctx.Model.GetEntityTypes()
            .Select(e => e.GetTableName())
            .Where(name => name is not null)
            .ToList();

        // THEN: every table name is snake_case — no PascalCase leak even with multiple entities.
        allTables.Should().NotBeEmpty();
        foreach (var table in allTables)
        {
            table!.Should().MatchRegex("^[a-z][a-z0-9_]*$",
                $"every table must be snake_case (got '{table}')");
        }
    }

    [Fact]
    public void OnModelCreating_PrimaryKeyColumnId_IsLowercaseId()
    {
        // GIVEN: a probe entity with a conventional 'Id' primary key.
        using var ctx = new MultiPropDbContext();
        var entityType = ctx.Model.FindEntityType(typeof(MultiPropEntity))!;
        var storeObject = StoreObjectIdentifier.Table(entityType.GetTableName()!, entityType.GetSchema());

        // WHEN.
        var idColumn = entityType.FindProperty("Id")!.GetColumnName(storeObject);

        // THEN: "Id" → "id" (no underscore, simple lower-casing).
        idColumn.Should().Be("id");
    }

    [Fact]
    public void OnModelCreating_IsDeterministic_AcrossMultipleContextInstances()
    {
        // GIVEN: two independent DbContext instances on the same options shape.
        using var ctx1 = new MultiPropDbContext();
        using var ctx2 = new MultiPropDbContext();

        var et1 = ctx1.Model.FindEntityType(typeof(MultiPropEntity))!;
        var et2 = ctx2.Model.FindEntityType(typeof(MultiPropEntity))!;

        // WHEN: comparing the materialized table / column names.
        var table1 = et1.GetTableName();
        var table2 = et2.GetTableName();
        var so1 = StoreObjectIdentifier.Table(table1!, et1.GetSchema());
        var so2 = StoreObjectIdentifier.Table(table2!, et2.GetSchema());
        var cols1 = et1.GetProperties().Select(p => p.GetColumnName(so1)).ToList();
        var cols2 = et2.GetProperties().Select(p => p.GetColumnName(so2)).ToList();

        // THEN: the naming output must be deterministic (no GUID / random suffixes leaking through).
        table1.Should().Be(table2);
        cols1.Should().BeEquivalentTo(cols2);
    }

    /// <summary>
    /// Probe entity covering multi-word, FK-suffix, decimal and DateTimeOffset properties.
    /// </summary>
    private sealed class MultiPropEntity
    {
        public Guid Id { get; set; }
        public Guid OwnerId { get; set; }
        public DateTimeOffset UpdatedAtUtc { get; set; }
        public decimal TotalAmount { get; set; }
        public string DisplayName { get; set; } = string.Empty;
    }

    private sealed class SecondaryEntity
    {
        public Guid Id { get; set; }
        public string SomeField { get; set; } = string.Empty;
    }

    private sealed class MultiPropDbContext : AppDbContext
    {
        public MultiPropDbContext()
            : base(new DbContextOptionsBuilder<AppDbContext>()
                .UseNpgsql("Host=localhost;Database=probe;Username=probe;Password=probe")
                .Options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<MultiPropEntity>();
            modelBuilder.Entity<SecondaryEntity>();
            base.OnModelCreating(modelBuilder);
        }
    }
}
