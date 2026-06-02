using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data.Extensions;
using Xunit;

namespace SiesaAgents.UnitTests.Data.Extensions;

/// <summary>
/// RED-phase unit tests for <c>ModelBuilder.ApplySnakeCaseNaming()</c>.
///
/// Covers Story 1.3 AC #4 (snake_case mandate, last call in OnModelCreating)
/// and AC #6 (xUnit unit test asserting the rule), traced to test-design
/// epic-1 TC-E1-P2-04.
///
/// These tests are RED until:
///   - <c>SiesaAgents.Infrastructure.Data.Extensions.ModelBuilderSnakeCaseExtensions</c> exists
///   - It exposes <c>public static ModelBuilder ApplySnakeCaseNaming(this ModelBuilder)</c>
///   - It exposes <c>internal static string ToSnakeCase(string input)</c>
///     (the assembly attribute <c>[assembly: InternalsVisibleTo("SiesaAgents.UnitTests")]</c>
///      MUST be placed on <c>SiesaAgents.Infrastructure</c> — see story Dev Notes).
/// </summary>
public class ModelBuilderSnakeCaseExtensionsTests
{
    // -------------------------------------------------------------------------
    // ToSnakeCase rule — table-driven (Story AC #6 second bullet + AC #4)
    // -------------------------------------------------------------------------

    [Theory]
    [InlineData("Cliente", "cliente")]
    [InlineData("ClienteEntity", "cliente_entity")]
    [InlineData("CreatedAt", "created_at")]
    [InlineData("ClienteID", "cliente_id")]
    [InlineData("NIT", "nit")]
    [InlineData("ID", "id")]
    [InlineData("id", "id")]
    [InlineData("", "")]
    public void ToSnakeCase_ConvertsPascalCaseAndAcronymsToSnakeCase(string input, string expected)
    {
        // GIVEN: a PascalCase / acronym / edge-case identifier produced by EF Core defaults

        // WHEN: ToSnakeCase is invoked
        var actual = ModelBuilderSnakeCaseExtensions.ToSnakeCase(input);

        // THEN: the output matches the exact contract documented in Story Dev Notes
        //       — "ID" stays glued (no underscore for contiguous uppercase),
        //       — "ClienteID" splits at the lower→upper boundary,
        //       — empty string is passed through unchanged.
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void ToSnakeCase_NullInput_ReturnsNull()
    {
        // GIVEN: a null identifier (defensive guard documented in Story Dev Notes)

        // WHEN: ToSnakeCase is invoked with null
        // (null-forgiving used intentionally to exercise the guard branch)
        var actual = ModelBuilderSnakeCaseExtensions.ToSnakeCase(null!);

        // THEN: the implementation MUST return the input unchanged (no NullReferenceException)
        Assert.Null(actual);
    }

    // -------------------------------------------------------------------------
    // ApplySnakeCaseNaming end-to-end on a ModelBuilder (AC #4)
    // -------------------------------------------------------------------------

    [Fact]
    public void ApplySnakeCaseNaming_RewritesPascalCaseTableAndColumnNames_OnSampleEntity()
    {
        // GIVEN: a throwaway DbContext with a single PascalCase entity ("SampleEntity")
        //        whose properties are "Id" and "CreatedAt".
        var options = new DbContextOptionsBuilder<SnakeCaseProbeContext>()
            .UseInMemoryDatabase($"SnakeCaseProbe_{Guid.NewGuid():N}")
            .Options;
        using var ctx = new SnakeCaseProbeContext(options);

        // WHEN: the model is materialized (forces OnModelCreating → ApplySnakeCaseNaming)
        var entity = ctx.Model.FindEntityType(typeof(SampleEntity))!;

        // THEN: the table name is snake_case ("sample_entity") AND every column name
        //       matches lower snake_case (^[a-z0-9_]+$).
        Assert.Equal("sample_entity", entity.GetTableName());

        foreach (var property in entity.GetProperties())
        {
            Assert.Matches("^[a-z0-9_]+$", property.GetColumnName());
        }

        // Specifically, "CreatedAt" must become "created_at" (architecture spec example).
        var createdAt = entity.FindProperty(nameof(SampleEntity.CreatedAt))!;
        Assert.Equal("created_at", createdAt.GetColumnName());
    }

    [Fact]
    public void ApplySnakeCaseNaming_IsIdempotent_AlreadySnakeCaseNamesAreUnchanged()
    {
        // GIVEN: a model whose table name was explicitly overridden to "clientes"
        //        (the per-entity SetTableName pattern that arrives in Epic 2 Story 2.1).
        var options = new DbContextOptionsBuilder<IdempotencyProbeContext>()
            .UseInMemoryDatabase($"SnakeCaseIdempotency_{Guid.NewGuid():N}")
            .Options;
        using var ctx = new IdempotencyProbeContext(options);

        // WHEN: the model is materialized (ApplySnakeCaseNaming runs LAST)
        var entity = ctx.Model.FindEntityType(typeof(SampleEntity))!;

        // THEN: an already-lowercase snake_case name survives intact (idempotent guarantee
        //       documented in Story Dev Notes — supports per-entity SetTableName overrides).
        Assert.Equal("clientes", entity.GetTableName());
    }

    // -------------------------------------------------------------------------
    // Test-only probe contexts (kept inside the test file to avoid leaking
    // throwaway entities into production assemblies).
    // -------------------------------------------------------------------------

    private sealed class SampleEntity
    {
        public Guid Id { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
    }

    private sealed class SnakeCaseProbeContext(DbContextOptions<SnakeCaseProbeContext> options)
        : DbContext(options)
    {
        public DbSet<SampleEntity> SampleEntities => Set<SampleEntity>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            // ApplySnakeCaseNaming MUST be the LAST call in OnModelCreating (AC #4).
            modelBuilder.ApplySnakeCaseNaming();
        }
    }

    private sealed class IdempotencyProbeContext(DbContextOptions<IdempotencyProbeContext> options)
        : DbContext(options)
    {
        public DbSet<SampleEntity> SampleEntities => Set<SampleEntity>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            // Explicit per-entity override that mirrors Epic 2 Story 2.1's clientes mapping.
            modelBuilder.Entity<SampleEntity>().ToTable("clientes");
            modelBuilder.ApplySnakeCaseNaming();
        }
    }
}
