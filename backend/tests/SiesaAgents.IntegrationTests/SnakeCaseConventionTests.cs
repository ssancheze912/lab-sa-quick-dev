using System;
using System.IO;
using System.Linq;
using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// ATDD - RED phase tests for Story 1.3 (Backend Database Foundation).
///
/// Covers:
///   AC #2 — <c>OnModelCreating(ModelBuilder)</c> invokes
///           <c>modelBuilder.ApplySnakeCaseNaming()</c> as the LAST call so
///           every future entity table / column / PK / FK / index name is
///           auto-converted to snake_case.
///   AC #7 — Integration test
///           <c>EfCore_OnModelCreating_AppliesSnakeCaseNaming</c> passes
///           (TC-E1-P2-04).
///
/// These tests are expected to FAIL until:
///   1. <c>SiesaAgents.Infrastructure.Data.AppDbContext</c> exists.
///   2. <c>SiesaAgents.Infrastructure.Data.Extensions.ModelBuilderSnakeCaseExtensions</c>
///      defines <c>ApplySnakeCaseNaming(this ModelBuilder)</c>.
///   3. <c>AppDbContext.OnModelCreating</c> calls
///      <c>modelBuilder.ApplySnakeCaseNaming()</c> as the LAST statement.
/// </summary>
public class SnakeCaseConventionTests
{
    /// <summary>
    /// In-memory throwaway entity used only to assert the snake_case convention
    /// is applied to real entities registered in the model.
    /// </summary>
    private sealed class ThrowawayTestEntity
    {
        public Guid Id { get; set; }
        public string? CreatedBy { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public Guid ClienteId { get; set; }
    }

    private sealed class TestableAppDbContext : AppDbContext
    {
        public TestableAppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Register a throwaway entity FIRST so the convention has something
            // non-trivial to rewrite.
            modelBuilder.Entity<ThrowawayTestEntity>(builder =>
            {
                builder.ToTable("ThrowawayTestEntities");
                builder.HasKey(x => x.Id);
                builder.Property(x => x.CreatedBy).HasColumnName("CreatedBy");
                builder.Property(x => x.CreatedAt).HasColumnName("CreatedAt");
                builder.Property(x => x.ClienteId).HasColumnName("ClienteId");
                builder.HasIndex(x => x.ClienteId).HasDatabaseName("IX_ThrowawayTestEntities_ClienteId");
            });

            // Delegate to the production OnModelCreating, which MUST call
            // modelBuilder.ApplySnakeCaseNaming() as its LAST statement.
            base.OnModelCreating(modelBuilder);
        }
    }

    private static TestableAppDbContext BuildContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"snake-case-test-{Guid.NewGuid()}")
            .Options;
        return new TestableAppDbContext(options);
    }

    /// <summary>
    /// TC-E1-P2-04 — Tables become snake_case after OnModelCreating runs.
    ///
    /// GIVEN AppDbContext is instantiated with a throwaway entity called
    ///       <c>ThrowawayTestEntities</c>.
    /// WHEN  the model is materialized (OnModelCreating fires).
    /// THEN  the resulting table name is <c>throwaway_test_entities</c>.
    /// </summary>
    [Fact]
    public void EfCore_OnModelCreating_ConvertsTableNamesToSnakeCase()
    {
        // GIVEN / WHEN
        using var ctx = BuildContext();
        var entity = ctx.Model.FindEntityType(typeof(ThrowawayTestEntity));

        // THEN
        Assert.NotNull(entity);
        Assert.Equal("throwaway_test_entities", entity!.GetTableName());
    }

    /// <summary>
    /// TC-E1-P2-04 — Columns become snake_case (PascalCase, camelCase, and the
    /// composed "ClienteId" → "cliente_id" all work).
    /// </summary>
    [Fact]
    public void EfCore_OnModelCreating_ConvertsColumnNamesToSnakeCase()
    {
        // GIVEN / WHEN
        using var ctx = BuildContext();
        var entity = ctx.Model.FindEntityType(typeof(ThrowawayTestEntity));
        Assert.NotNull(entity);

        var columnNames = entity!
            .GetProperties()
            .Select(p => p.GetColumnName())
            .Where(n => n is not null)
            .ToHashSet();

        // THEN — every column was rewritten to snake_case.
        Assert.Contains("id", columnNames);
        Assert.Contains("created_by", columnNames);
        Assert.Contains("created_at", columnNames);
        Assert.Contains("cliente_id", columnNames);
    }

    /// <summary>
    /// TC-E1-P2-04 — Indexes become snake_case (PascalCase prefixes such as
    /// "IX_" lowercase to "ix_").
    /// </summary>
    [Fact]
    public void EfCore_OnModelCreating_ConvertsIndexNamesToSnakeCase()
    {
        // GIVEN / WHEN
        using var ctx = BuildContext();
        var entity = ctx.Model.FindEntityType(typeof(ThrowawayTestEntity));
        Assert.NotNull(entity);

        var indexNames = entity!.GetIndexes()
            .Select(i => i.GetDatabaseName())
            .Where(n => n is not null)
            .ToList();

        // THEN — the index name must contain only lowercase chars / digits / _.
        Assert.NotEmpty(indexNames);
        foreach (var indexName in indexNames)
        {
            Assert.Matches("^[a-z0-9_]+$", indexName!);
        }
        Assert.Contains("ix_throwaway_test_entities_cliente_id", indexNames);
    }

    /// <summary>
    /// AC #2 — Source-level guarantee that <c>ApplySnakeCaseNaming()</c> is the
    /// LAST statement inside <c>OnModelCreating</c>. We assert via reflection
    /// that the production method body, decompiled to IL, ends with a call to
    /// the extension method. Since IL inspection is fragile in xUnit, we use a
    /// pragmatic alternative: locate the AppDbContext source file by walking
    /// up from the test assembly and assert the text of the last non-empty
    /// line of <c>OnModelCreating</c> contains <c>ApplySnakeCaseNaming(</c>.
    /// </summary>
    [Fact]
    public void EfCore_OnModelCreating_ApplySnakeCaseNamingIsTheLastCall()
    {
        // GIVEN — locate the AppDbContext.cs source file.
        var sourcePath = LocateAppDbContextSource();
        Assert.True(File.Exists(sourcePath),
            $"Expected AppDbContext.cs at '{sourcePath}'. Story 1.3 has not yet created it.");

        var source = File.ReadAllText(sourcePath);

        // WHEN — extract the OnModelCreating method body.
        var marker = "OnModelCreating";
        var startIdx = source.IndexOf(marker, StringComparison.Ordinal);
        Assert.True(startIdx >= 0, "OnModelCreating method not found in AppDbContext.cs");

        // Find the opening brace after the signature.
        var braceOpen = source.IndexOf('{', startIdx);
        Assert.True(braceOpen > 0, "Opening brace of OnModelCreating not found");

        // Naive matching closing brace at indent level — works because
        // OnModelCreating is short and has no nested blocks in the spec'd impl.
        var depth = 0;
        var braceClose = -1;
        for (var i = braceOpen; i < source.Length; i++)
        {
            if (source[i] == '{') depth++;
            else if (source[i] == '}')
            {
                depth--;
                if (depth == 0) { braceClose = i; break; }
            }
        }
        Assert.True(braceClose > 0, "Closing brace of OnModelCreating not found");

        var body = source[(braceOpen + 1)..braceClose];

        // THEN — the LAST non-empty, non-comment statement must call
        // ApplySnakeCaseNaming.
        var lastStatement = body
            .Split('\n', StringSplitOptions.RemoveEmptyEntries)
            .Select(l => l.Trim())
            .Where(l => l.Length > 0 && !l.StartsWith("//"))
            .LastOrDefault();

        Assert.NotNull(lastStatement);
        Assert.Contains("ApplySnakeCaseNaming(", lastStatement!);
    }

    /// <summary>
    /// AC #7 alias — TC-E1-P2-04 acceptance test name as declared in the story.
    /// Aggregates the table + column + index assertions and is the test the
    /// story explicitly names in its Task 7 acceptance list.
    /// </summary>
    [Fact]
    public void EfCore_OnModelCreating_AppliesSnakeCaseNaming()
    {
        // GIVEN / WHEN
        using var ctx = BuildContext();
        var entity = ctx.Model.FindEntityType(typeof(ThrowawayTestEntity));
        Assert.NotNull(entity);

        // THEN
        Assert.Equal("throwaway_test_entities", entity!.GetTableName());

        var columnNames = entity.GetProperties()
            .Select(p => p.GetColumnName())
            .Where(n => n is not null)
            .ToHashSet();
        Assert.Contains("cliente_id", columnNames);
        Assert.Contains("created_at", columnNames);
    }

    private static string LocateAppDbContextSource()
    {
        // Walk up from the running test assembly's directory until we find
        // backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs.
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir is not null)
        {
            var candidate = Path.Combine(
                dir.FullName,
                "src",
                "SiesaAgents.Infrastructure",
                "Data",
                "AppDbContext.cs");
            if (File.Exists(candidate)) return candidate;

            // Also try sibling backend/ (when test bin output is outside backend/).
            var sibling = Path.Combine(
                dir.FullName,
                "backend",
                "src",
                "SiesaAgents.Infrastructure",
                "Data",
                "AppDbContext.cs");
            if (File.Exists(sibling)) return sibling;

            dir = dir.Parent;
        }

        return string.Empty;
    }
}
