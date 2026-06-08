// Story 1.3: Backend Database Foundation
// Epic 1: Project Foundation & Application Shell
//
// AUTOMATE Phase — Unit-level EDGE CASES for SnakeCaseNamingConvention
//
// Expands the ATDD baseline (SnakeCaseNamingConventionTests.cs) which covered the
// canonical PascalCase / acronym / null / empty cases. This file targets:
//
//   - Digits embedded in identifiers
//   - Single-character identifiers
//   - Already-snake_case inputs (idempotency)
//   - Leading / trailing acronyms
//   - All-lowercase / all-uppercase short inputs
//   - Consecutive acronyms (e.g. "HTTPAPIService")
//   - Mixed digits + letters at acronym boundaries
//   - ApplySnakeCaseNaming on a model with real entities (table/column/PK rewriting)
//
// AC covered (extended): AC #4 (snake_case rewriting), TC-E1-P2-04 (DB-level + unit-level)
//
// No DB connection required — uses the in-memory model API via DbContextOptionsBuilder.

using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

public class SnakeCaseNamingConventionEdgeTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // [P1] Digit boundaries — letters↔digits must produce underscores per regex 1
    // ─────────────────────────────────────────────────────────────────────────

    [Theory]
    [InlineData("Field1", "field1")]
    [InlineData("V2Endpoint", "v2_endpoint")]
    [InlineData("Cliente1Id", "cliente1_id")]
    [InlineData("Oauth2Token", "oauth2_token")]
    public void ToSnakeCase_DigitsInIdentifier_HandlesBoundariesCorrectly(string input, string expected)
    {
        // GIVEN: An identifier containing digits at various positions
        // WHEN: snake_case is applied
        var result = SnakeCaseNamingConvention.ToSnakeCase(input);

        // THEN: digits stay attached to the lowercase token before them,
        //       and a new word boundary is inserted before the following uppercase letter
        Assert.Equal(expected, result);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [P2] Single-character identifiers — should not insert underscores
    // ─────────────────────────────────────────────────────────────────────────

    [Theory]
    [InlineData("A", "a")]
    [InlineData("a", "a")]
    [InlineData("1", "1")]
    [InlineData("_", "_")]
    public void ToSnakeCase_SingleCharInput_LowercasesWithoutInsertingUnderscore(string input, string expected)
    {
        // GIVEN: A 1-character identifier
        // WHEN: snake_case is applied
        var result = SnakeCaseNamingConvention.ToSnakeCase(input);

        // THEN: only the case is normalized, no boundary insertion
        Assert.Equal(expected, result);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [P1] Idempotency — applying snake_case to an already-snake input is a no-op
    // (regression guard for AC #4: re-running ApplySnakeCaseNaming would otherwise
    // corrupt names by repeated lowercase rewrites)
    // ─────────────────────────────────────────────────────────────────────────

    [Theory]
    [InlineData("created_at")]
    [InlineData("api_key")]
    [InlineData("http_client")]
    [InlineData("cliente_id")]
    [InlineData("__ef_migrations_history")]
    public void ToSnakeCase_AlreadySnakeCase_IsIdempotent(string input)
    {
        // GIVEN: A name already in snake_case
        // WHEN: snake_case is applied
        var first = SnakeCaseNamingConvention.ToSnakeCase(input);
        var second = SnakeCaseNamingConvention.ToSnakeCase(first);

        // THEN: The transform produces the same value on the second application
        Assert.Equal(input, first);
        Assert.Equal(first, second);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [P1] All-lowercase / all-uppercase / consecutive acronyms
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void ToSnakeCase_AllLowercase_ReturnsInputUnchanged()
    {
        // GIVEN: An already-lowercase input
        var input = "cliente";

        // WHEN: snake_case is applied
        var result = SnakeCaseNamingConvention.ToSnakeCase(input);

        // THEN: The result is identical (no insertions, no case flip)
        Assert.Equal("cliente", result);
    }

    [Fact]
    public void ToSnakeCase_AllUppercaseLongAcronym_CollapsesToLowercase()
    {
        // GIVEN: An all-uppercase long acronym (e.g. "JSON", "HTTP")
        var input = "HTTP";

        // WHEN: snake_case is applied
        var result = SnakeCaseNamingConvention.ToSnakeCase(input);

        // THEN: It collapses to lowercase with no inserted underscore (no word boundary)
        Assert.Equal("http", result);
    }

    [Fact]
    public void ToSnakeCase_ConsecutiveAcronyms_InsertsUnderscoresAtBoundaries()
    {
        // GIVEN: Two acronyms followed by a PascalCase word (real-world example)
        var input = "HTTPAPIService";

        // WHEN: snake_case is applied
        var result = SnakeCaseNamingConvention.ToSnakeCase(input);

        // THEN: The longest acronym run is preserved together up to the last capital
        //       before a lowercase word — regex 2 splits at "...HTTPAPI" + "Service"
        Assert.Equal("httpapi_service", result);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [P2] Whitespace and special-char inputs — neither expected from EF
    // metadata, but the helper MUST not crash on them (defensive coding)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void ToSnakeCase_WhitespaceOnly_ReturnsUnchanged()
    {
        // GIVEN: A whitespace-only input
        var input = "   ";

        // WHEN: snake_case is applied
        var result = SnakeCaseNamingConvention.ToSnakeCase(input);

        // THEN: Whitespace passes through unchanged (no regex match)
        Assert.Equal("   ", result);
    }

    [Fact]
    public void ToSnakeCase_PreservesExistingUnderscoresInsidePascalCase()
    {
        // GIVEN: An identifier that already contains an underscore (e.g. composite key column)
        var input = "Cliente_ID";

        // WHEN: snake_case is applied
        var result = SnakeCaseNamingConvention.ToSnakeCase(input);

        // THEN: The existing underscore is preserved and no extra underscore is inserted
        //       between "Cliente" and "ID" (because regex 1 sees lower→upper boundary
        //       only across one character — the underscore separates them already)
        Assert.Equal("cliente_id", result);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [P1] ApplySnakeCaseNaming on a populated model — proves the helper
    // actually rewrites tables/columns/PK names for real entities, not only
    // empty models (the ATDD AppDbContextTests cover the empty-model path).
    // This satisfies TC-E1-P2-04 at the model level for non-empty contexts.
    // ─────────────────────────────────────────────────────────────────────────

    private class TestEntityContext(DbContextOptions<TestEntityContext> options) : DbContext(options)
    {
        public DbSet<SampleEntity> SampleEntities => Set<SampleEntity>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.Entity<SampleEntity>().ToTable("SampleEntity");
            modelBuilder.ApplySnakeCaseNaming();
        }
    }

    public class SampleEntity
    {
        public int ID { get; set; }
        public string ClienteName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string APIKey { get; set; } = string.Empty;
    }

    private static TestEntityContext BuildContext()
    {
        var options = new DbContextOptionsBuilder<TestEntityContext>()
            .UseNpgsql("Host=localhost;Database=test;Username=u;Password=p")
            .Options;
        return new TestEntityContext(options);
    }

    [Fact]
    public void ApplySnakeCaseNaming_PopulatedModel_RewritesTableName()
    {
        // GIVEN: A DbContext with one entity mapped to a PascalCase table
        using var context = BuildContext();

        // WHEN: The model is materialized (OnModelCreating runs, ApplySnakeCaseNaming last)
        var table = context.Model.FindEntityType(typeof(SampleEntity))!.GetTableName();

        // THEN: The table name is lowercase snake_case
        Assert.Equal("sample_entity", table);
    }

    [Theory]
    [InlineData(nameof(SampleEntity.ID), "id")]
    [InlineData(nameof(SampleEntity.ClienteName), "cliente_name")]
    [InlineData(nameof(SampleEntity.CreatedAt), "created_at")]
    [InlineData(nameof(SampleEntity.APIKey), "api_key")]
    public void ApplySnakeCaseNaming_PopulatedModel_RewritesEachColumnName(
        string propertyName, string expectedColumn)
    {
        // GIVEN: A DbContext with one entity that has columns covering all the regex cases
        using var context = BuildContext();

        // WHEN: The column metadata is read
        var property = context.Model
            .FindEntityType(typeof(SampleEntity))!
            .FindProperty(propertyName)!;
        var column = property.GetColumnName();

        // THEN: Every column is lowercase snake_case
        Assert.Equal(expectedColumn, column);
    }

    [Fact]
    public void ApplySnakeCaseNaming_PopulatedModel_RewritesPrimaryKeyName()
    {
        // GIVEN: A DbContext with an entity that has a primary key
        using var context = BuildContext();

        // WHEN: The primary key constraint name is read
        var pkName = context.Model
            .FindEntityType(typeof(SampleEntity))!
            .FindPrimaryKey()!
            .GetName();

        // THEN: The PK constraint name is lowercase snake_case (regression for AC #4)
        Assert.NotNull(pkName);
        Assert.Equal(pkName, pkName!.ToLowerInvariant());
        Assert.DoesNotContain('A', pkName);
    }
}
