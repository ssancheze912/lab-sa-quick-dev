// -----------------------------------------------------------------------------
//  Story 1.3 — Backend Database Foundation
//  RED-phase ATDD unit test for AC #4 (`modelBuilder.ApplySnakeCaseNaming()`
//  rewrites table/column/key/foreign-key/index names to lower snake_case).
//
//  Expected RED-phase failure reasons (before DEV team implements Story 1.3):
//    1. Task 2 not done: `SiesaAgents.Infrastructure.Data.ModelBuilderExtensions`
//       does not exist → CS0246 compile error on ApplySnakeCaseNaming call.
//    2. UnitTests.csproj does NOT yet reference SiesaAgents.Infrastructure nor
//       the Microsoft.EntityFrameworkCore.InMemory package (Task 11 subtasks) →
//       CS0246 for `DbContext`, `DbContextOptionsBuilder`, etc.
//  Every failure above corresponds to a missing acceptance-criterion action.
// -----------------------------------------------------------------------------
using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

public class ModelBuilderExtensionsTests
{
    private class TestEntity
    {
        public Guid Id { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public DateTimeOffset CreatedAt { get; set; }
    }

    private class TestDbContext(DbContextOptions<TestDbContext> options) : DbContext(options)
    {
        public DbSet<TestEntity> TestEntities => Set<TestEntity>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.ApplySnakeCaseNaming();
        }
    }

    [Fact]
    public void GivenModelBuilderWithPascalCaseEntity_WhenApplySnakeCaseNamingIsCalled_ThenTableAndColumnsAreRewrittenToSnakeCase()
    {
        // GIVEN: a TestDbContext whose OnModelCreating invokes ApplySnakeCaseNaming
        //        as the last statement, and a TestEntity with PascalCase
        //        table/property names (TestEntity, CustomerName, CreatedAt, Id).
        var options = new DbContextOptionsBuilder<TestDbContext>()
            .UseInMemoryDatabase("apply-snake-case-test")
            .Options;

        // WHEN: the model is built (EF triggers OnModelCreating on first access
        //       to `ctx.Model`).
        using var ctx = new TestDbContext(options);
        var entity = ctx.Model.FindEntityType(typeof(TestEntity))!;

        // THEN: table and column physical names are lower snake_case.
        Assert.Equal("test_entity", entity.GetTableName());
        Assert.Equal(
            "customer_name",
            entity.FindProperty(nameof(TestEntity.CustomerName))!.GetColumnName());
        Assert.Equal(
            "created_at",
            entity.FindProperty(nameof(TestEntity.CreatedAt))!.GetColumnName());
        Assert.Equal(
            "id",
            entity.FindProperty(nameof(TestEntity.Id))!.GetColumnName());
    }
}
