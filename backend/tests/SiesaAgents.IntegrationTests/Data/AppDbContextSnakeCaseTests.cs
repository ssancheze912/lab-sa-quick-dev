using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests.Data;

/// <summary>
/// Integration tests for AC #3 (ApplySnakeCaseNaming applied in OnModelCreating) — TC-E1-P2-04.
/// Verifies that <see cref="AppDbContext.OnModelCreating"/> calls
/// <c>modelBuilder.ApplySnakeCaseNaming()</c> as the LAST statement so that every entity
/// registered (now or in future stories) is persisted with snake_case table and column names.
/// </summary>
public class AppDbContextSnakeCaseTests
{
    [Fact]
    public void OnModelCreating_AppliesSnakeCaseNaming_ToProbeEntityTableName()
    {
        // GIVEN: an AppDbContext that inherits a probe entity (PascalCase class name).
        using var context = new ProbeDbContext();

        // WHEN: the model is created (OnModelCreating runs lazily on first access).
        var entityType = context.Model.FindEntityType(typeof(ProbeEntity));

        // THEN: the underlying table name is snake_case ("probe_entity" or "probe_entities").
        entityType.Should().NotBeNull("the probe entity must be discovered in the model");
        var tableName = entityType!.GetTableName();
        tableName.Should().NotBeNull();
        tableName!.Should().MatchRegex("^[a-z][a-z0-9_]*$", "snake_case naming must be applied");
        tableName.Should().NotMatchRegex("[A-Z]", "no PascalCase characters allowed");
    }

    [Fact]
    public void OnModelCreating_AppliesSnakeCaseNaming_ToProbeEntityColumnNames()
    {
        // GIVEN: an AppDbContext that inherits a probe entity with PascalCase properties.
        using var context = new ProbeDbContext();

        // WHEN: the model is created.
        var entityType = context.Model.FindEntityType(typeof(ProbeEntity));

        // THEN: every column name is snake_case.
        entityType.Should().NotBeNull();
        var tableName = entityType!.GetTableName();
        var schema = entityType.GetSchema();
        var storeObject = Microsoft.EntityFrameworkCore.Metadata.StoreObjectIdentifier.Table(tableName!, schema);

        foreach (var property in entityType.GetProperties())
        {
            var columnName = property.GetColumnName(storeObject);
            columnName.Should().NotBeNull();
            columnName!.Should().MatchRegex("^[a-z][a-z0-9_]*$",
                $"column for property {property.Name} must be snake_case (got '{columnName}')");
        }
    }

    [Fact]
    public void OnModelCreating_ConvertsCamelCasePropertyName_ToSnakeCaseColumn()
    {
        // GIVEN: an AppDbContext with a probe entity containing a multi-word PascalCase property.
        using var context = new ProbeDbContext();

        // WHEN: the model is created.
        var entityType = context.Model.FindEntityType(typeof(ProbeEntity));
        var tableName = entityType!.GetTableName();
        var schema = entityType.GetSchema();
        var storeObject = Microsoft.EntityFrameworkCore.Metadata.StoreObjectIdentifier.Table(tableName!, schema);

        var createdAtColumn = entityType
            .FindProperty(nameof(ProbeEntity.CreatedAt))!
            .GetColumnName(storeObject);

        // THEN: "CreatedAt" must be persisted as "created_at".
        createdAtColumn.Should().Be("created_at");
    }

    /// <summary>
    /// Probe entity used only inside this test fixture to verify the snake_case convention.
    /// </summary>
    private sealed class ProbeEntity
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTimeOffset CreatedAt { get; set; }
    }

    /// <summary>
    /// Test-only DbContext that inherits the production AppDbContext OnModelCreating
    /// (which MUST call ApplySnakeCaseNaming as the LAST statement) and registers
    /// a probe entity to verify the convention is applied.
    ///
    /// Uses the Npgsql provider so relational metadata (GetTableName / GetColumnName)
    /// is materialized. No actual connection is opened — only the EF model is built.
    /// </summary>
    private sealed class ProbeDbContext : AppDbContext
    {
        public ProbeDbContext()
            : base(new DbContextOptionsBuilder<AppDbContext>()
                .UseNpgsql("Host=localhost;Database=probe;Username=probe;Password=probe")
                .Options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ProbeEntity>();
            // Production OnModelCreating MUST run AFTER our entity registration and apply snake_case.
            base.OnModelCreating(modelBuilder);
        }
    }
}
