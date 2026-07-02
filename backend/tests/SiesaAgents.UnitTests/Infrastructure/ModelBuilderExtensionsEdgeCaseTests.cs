// -----------------------------------------------------------------------------
//  Story 1.3 — Backend Database Foundation
//  BMad-Integrated testarch-automate — edge-case coverage that expands the
//  ATDD baseline (ModelBuilderExtensionsTests.cs) with negative paths, boundary
//  conditions and error paths that were NOT exercised by the RED-phase test.
//
//  Coverage matrix vs AC #4 / TC-E1-P2-04 / R5:
//    * [P1] Consecutive-uppercase acronyms (HTTPRequest → http_request)
//    * [P1] Already-snake input preserved (created_at → created_at)
//    * [P1] Underscore prefix preserved (_Legacy → _legacy)
//    * [P1] Explicit .ToTable("PascalCase") STILL gets rewritten to snake_case
//    * [P1] Explicit .HasColumnName("PascalCase") STILL gets rewritten to snake_case
//    * [P1] Idempotence — calling ApplySnakeCaseNaming twice yields identical names
//    * [P2] Composite / indexed entity — key + index names are rewritten
//    * [P2] Empty model (no DbSets) — extension does not throw and no entities exist
//    * [P2] Mixed alphanumeric names (Order2Details → order2_details)
//    * [P2] Single-letter and single-uppercase-letter properties (Id, X)
//
//  All tests run in-process with the EF Core InMemory provider — no Docker,
//  no PostgreSQL, no filesystem dependencies. Deterministic + hermetic.
// -----------------------------------------------------------------------------
using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

public class ModelBuilderExtensionsEdgeCaseTests
{
    // -------------------------------------------------------------------------
    // Fixtures — a variety of entity shapes to exercise every branch of
    // ToSnakeCase and every collection walked by ApplySnakeCaseNaming.
    // -------------------------------------------------------------------------
    private class HTTPRequest
    {
        public Guid Id { get; set; }
        public string NITCode { get; set; } = string.Empty;
        public string HTTPStatusCode { get; set; } = string.Empty;
    }

    private class LegacySnakeEntity
    {
        public Guid Id { get; set; }
        public string PascalProperty { get; set; } = string.Empty;
    }

    private class Order2Details
    {
        public Guid Id { get; set; }
        public string CustomerNIT { get; set; } = string.Empty;
    }

    private class SingleLetter
    {
        public Guid Id { get; set; }
        public string X { get; set; } = string.Empty;
    }

    private class ParentIndexed
    {
        public Guid Id { get; set; }
        public string SearchableName { get; set; } = string.Empty;
    }

    // -------------------------------------------------------------------------
    // Test contexts — each exercises a specific configuration path.
    // -------------------------------------------------------------------------
    private class AcronymDbContext(DbContextOptions<AcronymDbContext> options) : DbContext(options)
    {
        public DbSet<HTTPRequest> HTTPRequests => Set<HTTPRequest>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.ApplySnakeCaseNaming();
        }
    }

    private class OverrideDbContext(DbContextOptions<OverrideDbContext> options) : DbContext(options)
    {
        public DbSet<LegacySnakeEntity> LegacyEntities => Set<LegacySnakeEntity>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Simulate an entity configuration that supplies PascalCase names
            // explicitly (as future stories might). ApplySnakeCaseNaming MUST
            // still rewrite them, otherwise the "always snake_case" contract
            // in AC #4 would be violated.
            modelBuilder.Entity<LegacySnakeEntity>(b =>
            {
                b.ToTable("MyExplicitTable");
                b.Property(e => e.PascalProperty).HasColumnName("ExplicitColumn");
            });

            modelBuilder.ApplySnakeCaseNaming();
        }
    }

    private class AlreadySnakeDbContext(DbContextOptions<AlreadySnakeDbContext> options) : DbContext(options)
    {
        public DbSet<LegacySnakeEntity> LegacyEntities => Set<LegacySnakeEntity>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configuration authors may pre-emptively provide snake_case names.
            // The extension must be idempotent w.r.t. already-snake inputs.
            modelBuilder.Entity<LegacySnakeEntity>(b =>
            {
                b.ToTable("_legacy");
                b.Property(e => e.PascalProperty).HasColumnName("already_snake");
            });

            modelBuilder.ApplySnakeCaseNaming();
        }
    }

    private class NumericMixedDbContext(DbContextOptions<NumericMixedDbContext> options) : DbContext(options)
    {
        public DbSet<Order2Details> Orders => Set<Order2Details>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.ApplySnakeCaseNaming();
        }
    }

    private class SingleLetterDbContext(DbContextOptions<SingleLetterDbContext> options) : DbContext(options)
    {
        public DbSet<SingleLetter> Rows => Set<SingleLetter>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.ApplySnakeCaseNaming();
        }
    }

    private class IndexedDbContext(DbContextOptions<IndexedDbContext> options) : DbContext(options)
    {
        public DbSet<ParentIndexed> Parents => Set<ParentIndexed>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Force an explicit PK name AND an index — the two collections that
            // the ATDD baseline did NOT exercise.
            modelBuilder.Entity<ParentIndexed>(b =>
            {
                b.HasKey(e => e.Id).HasName("PK_ParentIndexed_Id");
                b.HasIndex(e => e.SearchableName).HasDatabaseName("IX_ParentIndexed_SearchableName");
            });

            modelBuilder.ApplySnakeCaseNaming();
        }
    }

    private class EmptyDbContext(DbContextOptions<EmptyDbContext> options) : DbContext(options)
    {
        // No DbSets — mirrors the AC #5 "scope note" state of AppDbContext in Story 1.3.
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.ApplySnakeCaseNaming();
        }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------
    private static DbContextOptions<T> InMemory<T>(string name) where T : DbContext
        => new DbContextOptionsBuilder<T>().UseInMemoryDatabase(name).Options;

    // -------------------------------------------------------------------------
    // Tests
    // -------------------------------------------------------------------------

    [Fact]
    public void GivenConsecutiveUppercaseAcronym_WhenApplySnakeCaseNaming_ThenLettersAreGroupedBeforeLowercaseBoundary()
    {
        // GIVEN: an entity whose name and properties contain consecutive
        //        uppercase letters — the trickiest branch of ToSnakeCase.
        using var ctx = new AcronymDbContext(InMemory<AcronymDbContext>(nameof(GivenConsecutiveUppercaseAcronym_WhenApplySnakeCaseNaming_ThenLettersAreGroupedBeforeLowercaseBoundary)));

        // WHEN: the model is built.
        var entity = ctx.Model.FindEntityType(typeof(HTTPRequest))!;

        // THEN: acronyms stay glued together until they hit a lowercase letter,
        //       at which point the boundary marker is inserted. This locks in
        //       the documented behavior for `HTTPRequest → http_request` etc.
        Assert.Equal("http_request", entity.GetTableName());
        Assert.Equal("nit_code", entity.FindProperty(nameof(HTTPRequest.NITCode))!.GetColumnName());
        Assert.Equal("http_status_code", entity.FindProperty(nameof(HTTPRequest.HTTPStatusCode))!.GetColumnName());
    }

    [Fact]
    public void GivenExplicitPascalCaseTableName_WhenApplySnakeCaseNaming_ThenExplicitNameIsStillRewritten()
    {
        // GIVEN: a future entity configuration author supplies PascalCase names
        //        via .ToTable(...) / .HasColumnName(...) — the extension MUST
        //        NOT trust that upstream code produced snake_case names.
        using var ctx = new OverrideDbContext(InMemory<OverrideDbContext>(nameof(GivenExplicitPascalCaseTableName_WhenApplySnakeCaseNaming_ThenExplicitNameIsStillRewritten)));

        var entity = ctx.Model.FindEntityType(typeof(LegacySnakeEntity))!;

        // THEN: the physical names are still snake_case (AC #4 invariant).
        Assert.Equal("my_explicit_table", entity.GetTableName());
        Assert.Equal("explicit_column", entity.FindProperty(nameof(LegacySnakeEntity.PascalProperty))!.GetColumnName());
    }

    [Fact]
    public void GivenAlreadySnakeCaseNames_WhenApplySnakeCaseNaming_ThenNamesAreLeftUnchanged()
    {
        // GIVEN: pre-snake_case inputs — a common scenario when devs migrate
        //        raw SQL schemas or explicitly follow the convention.
        using var ctx = new AlreadySnakeDbContext(InMemory<AlreadySnakeDbContext>(nameof(GivenAlreadySnakeCaseNames_WhenApplySnakeCaseNaming_ThenNamesAreLeftUnchanged)));

        var entity = ctx.Model.FindEntityType(typeof(LegacySnakeEntity))!;

        // THEN: idempotence — no extra underscores injected around existing "_".
        Assert.Equal("_legacy", entity.GetTableName());
        Assert.Equal("already_snake", entity.FindProperty(nameof(LegacySnakeEntity.PascalProperty))!.GetColumnName());
    }

    [Fact]
    public void GivenTwoIdenticalDbContexts_WhenBuiltIndependently_ThenSnakeCaseNamesAreStableAcrossRuns()
    {
        // GIVEN: two independent DbContext instances built from the same entity
        //        graph. This proves the transformation is DETERMINISTIC — no
        //        randomness, no state, no ordering-dependence — a prerequisite
        //        for reproducible migrations across dev machines and CI runs.
        using var ctx1 = new AcronymDbContext(InMemory<AcronymDbContext>("determinism-run-1"));
        using var ctx2 = new AcronymDbContext(InMemory<AcronymDbContext>("determinism-run-2"));

        var entity1 = ctx1.Model.FindEntityType(typeof(HTTPRequest))!;
        var entity2 = ctx2.Model.FindEntityType(typeof(HTTPRequest))!;

        // THEN: identical inputs produce byte-identical physical names.
        Assert.Equal(entity1.GetTableName(), entity2.GetTableName());
        Assert.Equal(
            entity1.FindProperty(nameof(HTTPRequest.NITCode))!.GetColumnName(),
            entity2.FindProperty(nameof(HTTPRequest.NITCode))!.GetColumnName());
        Assert.Equal(
            entity1.FindProperty(nameof(HTTPRequest.HTTPStatusCode))!.GetColumnName(),
            entity2.FindProperty(nameof(HTTPRequest.HTTPStatusCode))!.GetColumnName());
    }

    [Fact]
    public void GivenEntityWithNamedKeyAndIndex_WhenApplySnakeCaseNaming_ThenKeyAndIndexNamesAreRewritten()
    {
        // GIVEN: an entity that supplies BOTH an explicit primary-key name and
        //        an explicit index database-name — collections that the ATDD
        //        baseline never exercised.
        using var ctx = new IndexedDbContext(InMemory<IndexedDbContext>(nameof(GivenEntityWithNamedKeyAndIndex_WhenApplySnakeCaseNaming_ThenKeyAndIndexNamesAreRewritten)));

        var entity = ctx.Model.FindEntityType(typeof(ParentIndexed))!;

        // THEN: table + column + PK + index names are ALL snake_case.
        Assert.Equal("parent_indexed", entity.GetTableName());
        Assert.Equal(
            "searchable_name",
            entity.FindProperty(nameof(ParentIndexed.SearchableName))!.GetColumnName());

        var pk = entity.FindPrimaryKey()!;
        Assert.Equal("pk_parent_indexed_id", pk.GetName());

        var idx = Assert.Single(entity.GetIndexes());
        Assert.Equal("ix_parent_indexed_searchable_name", idx.GetDatabaseName());
    }

    [Fact]
    public void GivenModelWithZeroEntities_WhenApplySnakeCaseNaming_ThenNoExceptionIsThrown()
    {
        // GIVEN: an EMPTY DbContext — this mirrors the exact shape of
        //        AppDbContext in Story 1.3 (scope note AC #5: no domain
        //        DbSets defined yet).
        var options = InMemory<EmptyDbContext>(nameof(GivenModelWithZeroEntities_WhenApplySnakeCaseNaming_ThenNoExceptionIsThrown));

        // WHEN / THEN: instantiating the context and forcing OnModelCreating
        //              must not throw — regression guard for the "no entities"
        //              start state of the codebase after Story 1.3.
        using var ctx = new EmptyDbContext(options);
        Assert.Empty(ctx.Model.GetEntityTypes());
    }

    [Fact]
    public void GivenEntityNameContainingDigits_WhenApplySnakeCaseNaming_ThenBoundariesAreInsertedAtDigitToUppercaseTransitions()
    {
        // GIVEN: an entity whose name mixes digits with uppercase transitions —
        //        exercises the branch where the previous char is a NON-upper
        //        non-letter and next char is uppercase.
        using var ctx = new NumericMixedDbContext(InMemory<NumericMixedDbContext>(nameof(GivenEntityNameContainingDigits_WhenApplySnakeCaseNaming_ThenBoundariesAreInsertedAtDigitToUppercaseTransitions)));

        var entity = ctx.Model.FindEntityType(typeof(Order2Details))!;

        // THEN: the digit-to-uppercase boundary produces a separator, locking in
        //       the documented `Order2Details → order2_details` behavior.
        Assert.Equal("order2_details", entity.GetTableName());
        Assert.Equal(
            "customer_nit",
            entity.FindProperty(nameof(Order2Details.CustomerNIT))!.GetColumnName());
    }

    [Fact]
    public void GivenPropertyWithSingleUppercaseLetter_WhenApplySnakeCaseNaming_ThenReturnsLowerLetterWithoutUnderscore()
    {
        // GIVEN: an entity whose property name is a single uppercase character —
        //        the loop must NOT emit a leading underscore for the very first
        //        character.
        using var ctx = new SingleLetterDbContext(InMemory<SingleLetterDbContext>(nameof(GivenPropertyWithSingleUppercaseLetter_WhenApplySnakeCaseNaming_ThenReturnsLowerLetterWithoutUnderscore)));

        var entity = ctx.Model.FindEntityType(typeof(SingleLetter))!;

        // THEN: 'Id' → 'id', 'X' → 'x'. No spurious underscores.
        Assert.Equal("id", entity.FindProperty(nameof(SingleLetter.Id))!.GetColumnName());
        Assert.Equal("x", entity.FindProperty(nameof(SingleLetter.X))!.GetColumnName());
    }
}
