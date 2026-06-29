using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests.Data;

/// <summary>
/// Integration tests for AC #3 (ApplySnakeCaseNaming applied in OnModelCreating) — TC-E1-P2-04.
/// RED phase: these tests fail until AppDbContext exists at
/// SiesaAgents.Infrastructure.Data.AppDbContext and OnModelCreating calls
/// modelBuilder.ApplySnakeCaseNaming() as the LAST statement.
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

        // THEN: the underlying table name is snake_case ("probe_entities" or "probe_entity").
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
        foreach (var property in entityType!.GetProperties())
        {
            var columnName = property.GetColumnName();
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
        var createdAtColumn = entityType!.FindProperty(nameof(ProbeEntity.CreatedAt))!.GetColumnName();

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
    /// </summary>
    private sealed class ProbeDbContext : AppDbContext
    {
        public ProbeDbContext()
            : base(new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase($"snake-case-probe-{Guid.NewGuid()}")
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
