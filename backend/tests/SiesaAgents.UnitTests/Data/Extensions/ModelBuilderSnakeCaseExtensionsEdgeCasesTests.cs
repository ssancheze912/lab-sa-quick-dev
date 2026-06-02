using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data.Extensions;
using Xunit;

namespace SiesaAgents.UnitTests.Data.Extensions;

/// <summary>
/// Edge-case / negative-path unit tests for <c>ModelBuilderSnakeCaseExtensions</c>.
///
/// Story 1.3 AC #4 — extends the baseline ATDD suite
/// (<see cref="ModelBuilderSnakeCaseExtensionsTests"/>) with boundary conditions,
/// idempotency, fluent contract, and digit/acronym shapes the production code
/// is likely to encounter once Epic 2 entities arrive (clientes / contactos).
///
/// Priority: P2 — Medium (regression net for snake_case rule).
/// </summary>
public class ModelBuilderSnakeCaseExtensionsEdgeCasesTests
{
    // -------------------------------------------------------------------------
    // [P2] ToSnakeCase — additional boundary inputs
    // -------------------------------------------------------------------------

    [Theory]
    [InlineData("A", "a")]                       // single uppercase letter
    [InlineData("a", "a")]                       // single lowercase letter
    [InlineData("UUID", "uuid")]                 // all-uppercase acronym stays glued
    [InlineData("HTTPSConnection", "httpsconnection")] // acronym + lowercase boundary is NOT split (current contract)
    [InlineData("already_snake", "already_snake")]     // already snake — left as-is
    [InlineData("Address2Line", "address2_line")]      // digit then uppercase splits
    [InlineData("Version2", "version2")]               // letter then digit does NOT split
    [InlineData("V2", "v2")]                           // short letter+digit combo
    [InlineData("MyHTTPServer", "my_httpserver")]      // lower→upper splits once; contiguous uppercase stays glued
    [InlineData("OrderID2", "order_id2")]              // PascalCase + acronym + digit
    public void ToSnakeCase_HandlesBoundaryShapesPerStoryContract(string input, string expected)
    {
        // GIVEN: an identifier shape EF Core may generate when entities arrive in Epic 2/3
        // WHEN: ToSnakeCase is invoked
        var actual = ModelBuilderSnakeCaseExtensions.ToSnakeCase(input);

        // THEN: the output exactly matches the documented rule
        //       (insert "_" only before uppercase preceded by lowercase OR digit,
        //        then ToLowerInvariant). Contiguous uppercase stays glued — this
        //        is intentional and matches the architecture spec example "ID" → "id".
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void ToSnakeCase_IsIdempotent_RunningTwiceProducesSameOutput()
    {
        // GIVEN: a PascalCase identifier
        const string input = "ClienteEntityCreatedAt";

        // WHEN: ToSnakeCase is applied twice
        var firstPass = ModelBuilderSnakeCaseExtensions.ToSnakeCase(input);
        var secondPass = ModelBuilderSnakeCaseExtensions.ToSnakeCase(firstPass);

        // THEN: the second pass returns the first pass unchanged — required because
        //       OnModelCreating runs once per DbContext model creation but the rule
        //       must stay stable if a future refactor re-applies it after explicit
        //       SetTableName overrides (Epic 2 Story 2.1 pattern).
        Assert.Equal(firstPass, secondPass);
        Assert.Equal("cliente_entity_created_at", secondPass);
    }

    // -------------------------------------------------------------------------
    // [P2] ApplySnakeCaseNaming — fluent contract & empty model
    // -------------------------------------------------------------------------

    [Fact]
    public void ApplySnakeCaseNaming_ReturnsSameModelBuilderInstance_ForFluentChaining()
    {
        // GIVEN: a probe DbContext built against the InMemory provider
        var options = new DbContextOptionsBuilder<FluentProbeContext>()
            .UseInMemoryDatabase($"FluentProbe_{Guid.NewGuid():N}")
            .Options;
        using var ctx = new FluentProbeContext(options);

        // WHEN: we materialize the model (forces OnModelCreating)
        // (no direct call — the assertion is that the context resolves without throwing,
        //  which exercises the fluent return inside FluentProbeContext.OnModelCreating)
        var model = ctx.Model;

        // THEN: the model was built — i.e. the fluent return did not break the chain.
        //       Production code (AppDbContext) calls `modelBuilder.ApplySnakeCaseNaming()`
        //       in a fluent posture; if the extension returned null this would NPE.
        Assert.NotNull(model);
    }

    [Fact]
    public void ApplySnakeCaseNaming_OnEmptyModel_IsSafeNoOp()
    {
        // GIVEN: AppDbContext-shaped probe with ZERO entity types (mirrors Story 1.3 scope-note —
        //        no DbSet<T> properties exist yet).
        var options = new DbContextOptionsBuilder<EmptyProbeContext>()
            .UseInMemoryDatabase($"EmptyProbe_{Guid.NewGuid():N}")
            .Options;
        using var ctx = new EmptyProbeContext(options);

        // WHEN: we materialize the model (ApplySnakeCaseNaming iterates GetEntityTypes())
        var entityTypes = ctx.Model.GetEntityTypes().ToList();

        // THEN: zero entities, zero exceptions — the extension must tolerate empty models
        //       because that is precisely AppDbContext's shape until Epic 2.
        Assert.Empty(entityTypes);
    }

    [Fact]
    public void ApplySnakeCaseNaming_RewritesExplicitHasColumnNameOverrides()
    {
        // GIVEN: a probe entity whose property explicitly maps to a PascalCase column
        //        via Fluent API (`.HasColumnName("MyCustomCol")`). This is the pattern
        //        Epic 2 / Epic 3 IEntityTypeConfiguration files may emit before snake_case
        //        normalization runs.
        var options = new DbContextOptionsBuilder<ExplicitColumnProbeContext>()
            .UseInMemoryDatabase($"ExplicitColumn_{Guid.NewGuid():N}")
            .Options;
        using var ctx = new ExplicitColumnProbeContext(options);

        // WHEN: the model is materialized
        var entity = ctx.Model.FindEntityType(typeof(SampleExplicitColumn))!;
        var property = entity.FindProperty(nameof(SampleExplicitColumn.PascalProp))!;

        // THEN: the explicit PascalCase override "MyCustomCol" is rewritten to "my_custom_col".
        //       This guards the architecture rule: ApplySnakeCaseNaming runs LAST so it
        //       always wins over per-property overrides that forgot to use snake_case.
        Assert.Equal("my_custom_col", property.GetColumnName());
    }

    // -------------------------------------------------------------------------
    // Test-only probe contexts (sealed + private to avoid leaking into prod code)
    // -------------------------------------------------------------------------

    private sealed class FluentProbeEntity
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    private sealed class FluentProbeContext(DbContextOptions<FluentProbeContext> options)
        : DbContext(options)
    {
        public DbSet<FluentProbeEntity> Entities => Set<FluentProbeEntity>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            // Fluent chain — relies on ApplySnakeCaseNaming returning the same ModelBuilder.
            var returned = modelBuilder.ApplySnakeCaseNaming();
            // Sanity: the returned reference IS the same instance (extension contract).
            Assert.Same(modelBuilder, returned);
        }
    }

    private sealed class EmptyProbeContext(DbContextOptions<EmptyProbeContext> options)
        : DbContext(options)
    {
        // No DbSet<T> — mirrors AppDbContext shape in Story 1.3.
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.ApplySnakeCaseNaming();
        }
    }

    private sealed class SampleExplicitColumn
    {
        public Guid Id { get; set; }
        public string PascalProp { get; set; } = string.Empty;
    }

    private sealed class ExplicitColumnProbeContext(DbContextOptions<ExplicitColumnProbeContext> options)
        : DbContext(options)
    {
        public DbSet<SampleExplicitColumn> Entities => Set<SampleExplicitColumn>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            // Explicit PascalCase override BEFORE ApplySnakeCaseNaming — must still be rewritten.
            modelBuilder.Entity<SampleExplicitColumn>()
                .Property(e => e.PascalProp)
                .HasColumnName("MyCustomCol");
            modelBuilder.ApplySnakeCaseNaming();
        }
    }
}
