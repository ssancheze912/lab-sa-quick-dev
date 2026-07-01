using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Data;

/// <summary>
/// Expands AC #3 (Story 1.3) coverage with edge cases for the PascalCase -> snake_case
/// regex conversion in ModelBuilderExtensions.ApplySnakeCaseNaming(), which the ATDD
/// integration tests (SnakeCaseNamingTests) only exercise indirectly via the EF migrations
/// history table (two columns: MigrationId, ProductVersion). These unit tests isolate the
/// conversion logic itself (no PostgreSQL connection required — UseNpgsql() only configures
/// the model, it never opens a socket) and cover patterns not present in the migrations
/// history table: consecutive uppercase (acronyms), digits, already-snake_case input,
/// single-letter names, and idempotency.
///
/// A local ProbeDbContext with a real DbSet is used (instead of AppDbContext, which has zero
/// DbSets by this story's scope boundary) so EF's property-discovery conventions run and
/// ApplySnakeCaseNaming() has real entity/property metadata to convert.
/// </summary>
public class ModelBuilderExtensionsTests
{
    private sealed class SampleEntity
    {
        public int Id { get; set; }
        public string CustomerID { get; set; } = string.Empty;
        public string OrderNumber2024 { get; set; } = string.Empty;
        public string already_snake_case { get; set; } = string.Empty;
        public string A { get; set; } = string.Empty;
        public string HTMLParser { get; set; } = string.Empty;
    }

    private sealed class ProbeDbContext(DbContextOptions<ProbeDbContext> options) : DbContext(options)
    {
        public DbSet<SampleEntity> SampleEntities => Set<SampleEntity>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.ApplySnakeCaseNaming();
        }
    }

    private sealed class DoubleApplyProbeDbContext(DbContextOptions<DoubleApplyProbeDbContext> options) : DbContext(options)
    {
        public DbSet<SampleEntity> SampleEntities => Set<SampleEntity>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.ApplySnakeCaseNaming();
            // Apply a second time in the same model-building pass to prove the conversion
            // is idempotent (already-lowercase/underscored names produce no further change).
            modelBuilder.ApplySnakeCaseNaming();
        }
    }

    private static IEntityType BuildSampleEntityModel()
    {
        // UseNpgsql only configures the model/provider; it never opens a socket, so this
        // runs fully offline without a real PostgreSQL connection.
        var options = new DbContextOptionsBuilder<ProbeDbContext>()
            .UseNpgsql("Host=localhost;Database=unit_test_never_connects")
            .Options;
        using var context = new ProbeDbContext(options);
        return context.Model.GetEntityTypes().Single();
    }

    [Fact]
    public void ApplySnakeCaseNaming_ConvertsPluralizedTableName()
    {
        // GIVEN a model with entity "SampleEntity" (EF pluralizes table names by convention)
        var entity = BuildSampleEntityModel();

        // WHEN applying snake_case naming
        // (already applied inside ProbeDbContext.OnModelCreating during model build above)

        // THEN the table name is snake_case (pluralization is EF's convention, unrelated
        // to ApplySnakeCaseNaming, but the casing conversion still applies to the result)
        Assert.Equal("sample_entities", entity.GetTableName());
    }

    [Fact]
    public void ApplySnakeCaseNaming_ConvertsPrimaryKeyIdColumn()
    {
        // GIVEN the standard "Id" primary key property present on every entity
        var entity = BuildSampleEntityModel();

        // WHEN/THEN "Id" converts to "id" (single word, just lowercased)
        var column = entity.GetProperties().Single(p => p.Name == "Id").GetColumnName();
        Assert.Equal("id", column);
    }

    [Fact]
    public void ApplySnakeCaseNaming_HandlesConsecutiveUppercaseAcronym_CustomerID()
    {
        // GIVEN a property name ending in a consecutive-uppercase acronym (ID)
        var entity = BuildSampleEntityModel();

        // WHEN/THEN the regex inserts '_' at each lower-to-upper transition, so "CustomerID"
        // (transition at "r"->"I") becomes "customer_id" — consecutive uppercase letters (ID)
        // are NOT further split from each other
        var column = entity.GetProperties().Single(p => p.Name == "CustomerID").GetColumnName();
        Assert.Equal("customer_id", column);
    }

    [Fact]
    public void ApplySnakeCaseNaming_HandlesDigitsInPropertyName()
    {
        // GIVEN a property name containing trailing digits (OrderNumber2024)
        var entity = BuildSampleEntityModel();

        // WHEN/THEN digits are not treated as an uppercase boundary, so no underscore is
        // inserted before them: "order_number2024"
        var column = entity.GetProperties().Single(p => p.Name == "OrderNumber2024").GetColumnName();
        Assert.Equal("order_number2024", column);
    }

    [Fact]
    public void ApplySnakeCaseNaming_LeavesAlreadySnakeCasePropertyUnchanged()
    {
        // GIVEN a property name that is already snake_case (all lowercase with underscores)
        var entity = BuildSampleEntityModel();

        // WHEN/THEN the already-lowercase name is left unchanged (no uppercase transitions
        // exist for the regex to act on)
        var column = entity.GetProperties().Single(p => p.Name == "already_snake_case").GetColumnName();
        Assert.Equal("already_snake_case", column);
    }

    [Fact]
    public void ApplySnakeCaseNaming_HandlesSingleUppercaseLetterPropertyName()
    {
        // GIVEN a property name that is a single uppercase letter ("A")
        var entity = BuildSampleEntityModel();

        // WHEN/THEN it is simply lowercased (no preceding character to create a boundary)
        var column = entity.GetProperties().Single(p => p.Name == "A").GetColumnName();
        Assert.Equal("a", column);
    }

    [Fact]
    public void ApplySnakeCaseNaming_HandlesFullAcronymPrefix_HTMLParser()
    {
        // GIVEN a property name starting with a multi-letter acronym followed by a word
        // (HTMLParser) - documents actual regex behavior for this edge case
        var entity = BuildSampleEntityModel();

        // WHEN/THEN only a lower-to-upper transition triggers an underscore. "HTMLParser" has
        // no lowercase-followed-by-uppercase transition (H-T-M-L-P are all consecutive
        // uppercase, then "arser" is all lowercase), so the whole name is just lowercased
        // with NO underscore inserted: "htmlparser". This documents a known limitation of the
        // regex-based converter for acronym-prefixed names.
        var column = entity.GetProperties().Single(p => p.Name == "HTMLParser").GetColumnName();
        Assert.Equal("htmlparser", column);
    }

    [Fact]
    public void ApplySnakeCaseNaming_IsIdempotentWhenAppliedTwiceInSameModelBuild()
    {
        // GIVEN a model where ApplySnakeCaseNaming() runs twice back-to-back during the same
        // OnModelCreating pass (DoubleApplyProbeDbContext)
        var options = new DbContextOptionsBuilder<DoubleApplyProbeDbContext>()
            .UseNpgsql("Host=localhost;Database=unit_test_never_connects")
            .Options;
        using var context = new DoubleApplyProbeDbContext(options);
        var doubleAppliedEntity = context.Model.GetEntityTypes().Single();

        // WHEN comparing against a model where it was applied exactly once
        var singleAppliedEntity = BuildSampleEntityModel();

        // THEN the resulting table and column names are identical either way (idempotent —
        // re-running the conversion on already-lowercase/underscored names is a no-op)
        Assert.Equal(singleAppliedEntity.GetTableName(), doubleAppliedEntity.GetTableName());
        Assert.Equal(
            singleAppliedEntity.GetProperties().Select(p => p.GetColumnName()),
            doubleAppliedEntity.GetProperties().Select(p => p.GetColumnName()));
    }
}
