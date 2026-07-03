using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;
using SiesaAgents.Infrastructure.Data.Conventions;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// TC-E1-P2-04 fallback — validates that `ApplySnakeCaseNaming` correctly
/// renames tables + columns AND that `AppDbContext.OnModelCreating` invokes it
/// LAST (the rule mandated by test-design-epic-1.md § 10 rule #2 and Story 1.3
/// AC #4).
///
/// This suite runs everywhere — no external database required — so TC-E1-P2-04
/// stays covered when the sandbox proxy blocks the Postgres image pull for
/// EfCoreMigrationTests.
///
/// RED-phase expectation for Story 1.3:
///   Fails to compile until `SnakeCaseNamingConvention.ApplySnakeCaseNaming`
///   (Task 2), `AppDbContext` (Task 3), and `SnakeCaseNamingConvention.ToSnakeCase`
///   (Task 2) exist.
/// </summary>
public class AppDbContextConventionTests
{
    // Probe entity — deliberately in the test project so `AppDbContext` itself
    // stays free of `DbSet<T>` declarations (scope note in Story 1.3 forbids
    // entities in Infrastructure until Epic 2).
    private class ProbeEntity
    {
        public Guid Id { get; set; }
        public string CreatedByUserName { get; set; } = string.Empty;
    }

    private class ProbeDbContext(DbContextOptions<ProbeDbContext> options) : DbContext(options)
    {
        public DbSet<ProbeEntity> ProbeEntities => Set<ProbeEntity>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.ApplySnakeCaseNaming();
        }
    }

    [Fact]
    public void ApplySnakeCaseNaming_converts_entity_and_column_names()
    {
        // GIVEN: a DbContext whose OnModelCreating calls ApplySnakeCaseNaming.
        var options = new DbContextOptionsBuilder<ProbeDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        using var ctx = new ProbeDbContext(options);

        // WHEN: the model is materialised.
        var entity = ctx.Model.FindEntityType(typeof(ProbeEntity));

        // THEN: table name and column names are snake_case.
        Assert.NotNull(entity);
        Assert.Equal("probe_entity", entity!.GetTableName());
        Assert.Equal("id", entity.FindProperty(nameof(ProbeEntity.Id))!.GetColumnName());
        Assert.Equal(
            "created_by_user_name",
            entity.FindProperty(nameof(ProbeEntity.CreatedByUserName))!.GetColumnName());
    }

    [Theory]
    [InlineData("ID", "id")]
    [InlineData("CreatedAt", "created_at")]
    [InlineData("APIKey", "api_key")]
    [InlineData("HTTPClient", "http_client")]
    [InlineData("CreatedByUserID", "created_by_user_id")]
    [InlineData("OrderItem", "order_item")]
    [InlineData("Product", "product")]
    public void ToSnakeCase_handles_pascal_and_acronyms(string input, string expected)
    {
        // GIVEN: an identifier written in PascalCase (possibly with acronyms).
        // WHEN:  ToSnakeCase transforms it.
        var actual = SnakeCaseNamingConvention.ToSnakeCase(input);

        // THEN: it becomes the expected snake_case form.
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void AppDbContext_OnModelCreating_yields_snake_case_metadata_when_probed_via_reflection()
    {
        // GIVEN: the production AppDbContext registered with EF Core's in-memory
        //        provider. Story 2.1 landed ClienteEntity, so we can now assert
        //        directly on the real entity that `ApplySnakeCaseNaming` runs
        //        LAST (per test-design-epic-1.md §10 rule #2).
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        using var ctx = new AppDbContext(options);

        // WHEN: the ClienteEntity model metadata is inspected.
        var entity = ctx.Model.FindEntityType(
            "SiesaAgents.Domain.Clientes.Entities.ClienteEntity");

        // THEN: the table + column names are snake_case — proves the convention
        //       ran after ApplyConfigurationsFromAssembly.
        Assert.NotNull(entity);
        Assert.Equal("clientes", entity!.GetTableName());
        Assert.Equal("nit_ruc", entity.FindProperty("NitRuc")!.GetColumnName());
        Assert.Equal("created_at", entity.FindProperty("CreatedAt")!.GetColumnName());
        Assert.Equal("updated_at", entity.FindProperty("UpdatedAt")!.GetColumnName());
    }
}
