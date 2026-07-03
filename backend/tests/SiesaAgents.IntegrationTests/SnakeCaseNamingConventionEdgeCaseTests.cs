using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data.Conventions;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// Edge-case coverage for <see cref="SnakeCaseNamingConvention"/> that ATDD did
/// not exercise: empty/null/whitespace inputs, idempotency, numeric boundaries,
/// consecutive uppercase runs, index (ix_/uk_) naming, foreign-key (fk_) naming,
/// primary-key (pk_) naming, and multi-entity model rewriting.
///
/// All tests use the in-memory provider or pure static method calls — no Docker,
/// no Testcontainers, no external services required.
/// </summary>
public class SnakeCaseNamingConventionEdgeCaseTests
{
    // --- ToSnakeCase — boundary inputs -----------------------------------

    [Fact]
    public void ToSnakeCase_returns_empty_for_empty_input_P1()
    {
        // GIVEN: an empty string
        // WHEN:  ToSnakeCase is called
        // THEN:  the same empty string is returned (guard against NRE / bad regex)
        Assert.Equal(string.Empty, SnakeCaseNamingConvention.ToSnakeCase(string.Empty));
    }

    [Fact]
    public void ToSnakeCase_returns_input_for_whitespace_P2()
    {
        // GIVEN: whitespace-only input
        // WHEN:  ToSnakeCase runs
        // THEN:  the value is returned unchanged (contract in the impl)
        var input = "   ";
        Assert.Equal(input, SnakeCaseNamingConvention.ToSnakeCase(input));
    }

    [Theory]
    [InlineData("id", "id")]
    [InlineData("api_key", "api_key")]
    [InlineData("created_by_user_id", "created_by_user_id")]
    public void ToSnakeCase_is_idempotent_on_already_snake_case_input_P0(string input, string expected)
    {
        // Applying ToSnakeCase twice must never break already-lowercased values —
        // proves ApplySnakeCaseNaming can be safely re-run without corrupting metadata.
        var once = SnakeCaseNamingConvention.ToSnakeCase(input);
        var twice = SnakeCaseNamingConvention.ToSnakeCase(once);

        Assert.Equal(expected, once);
        Assert.Equal(expected, twice);
    }

    [Theory]
    [InlineData("Value1Test", "value1_test")]
    [InlineData("User2FA", "user2_fa")]
    [InlineData("OAuth2Provider", "o_auth2_provider")]
    public void ToSnakeCase_handles_digit_boundaries_P2(string input, string expected)
    {
        // Digits are boundary characters — the regex must split at digit→Upper transitions.
        Assert.Equal(expected, SnakeCaseNamingConvention.ToSnakeCase(input));
    }

    [Theory]
    [InlineData("A", "a")]
    [InlineData("a", "a")]
    [InlineData("XML", "xml")]
    public void ToSnakeCase_preserves_single_segment_tokens_P2(string input, string expected)
    {
        // Single-token inputs must lowercase without inserting spurious underscores.
        Assert.Equal(expected, SnakeCaseNamingConvention.ToSnakeCase(input));
    }

    // --- ApplySnakeCaseNaming — model-level rewrites ---------------------

    private class Author
    {
        public Guid Id { get; set; }
        public string DisplayName { get; set; } = string.Empty;
    }

    private class BlogPost
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public Guid AuthorID { get; set; }
        public Author Author { get; set; } = null!;
    }

    private class RelationalDbContext(DbContextOptions<RelationalDbContext> options) : DbContext(options)
    {
        public DbSet<Author> Authors => Set<Author>();
        public DbSet<BlogPost> BlogPosts => Set<BlogPost>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<BlogPost>()
                .HasOne(p => p.Author)
                .WithMany()
                .HasForeignKey(p => p.AuthorID);

            // Add a unique index so ApplySnakeCaseNaming exercises the uk_ branch.
            modelBuilder.Entity<Author>()
                .HasIndex(a => a.DisplayName)
                .IsUnique();

            // And a non-unique index for the ix_ branch.
            modelBuilder.Entity<BlogPost>()
                .HasIndex(p => p.Title);

            modelBuilder.ApplySnakeCaseNaming();
        }
    }

    private static RelationalDbContext BuildRelationalContext()
    {
        var options = new DbContextOptionsBuilder<RelationalDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new RelationalDbContext(options);
    }

    [Fact]
    public void ApplySnakeCaseNaming_renames_multiple_entity_tables_P1()
    {
        using var ctx = BuildRelationalContext();

        var authorTable = ctx.Model.FindEntityType(typeof(Author))!.GetTableName();
        var postTable = ctx.Model.FindEntityType(typeof(BlogPost))!.GetTableName();

        Assert.Equal("author", authorTable);
        Assert.Equal("blog_post", postTable);
    }

    [Fact]
    public void ApplySnakeCaseNaming_renames_foreign_key_column_P1()
    {
        using var ctx = BuildRelationalContext();

        var post = ctx.Model.FindEntityType(typeof(BlogPost))!;
        var authorFk = post.FindProperty(nameof(BlogPost.AuthorID))!;

        // AuthorID has to collapse to author_id (proves acronym-tail handling in a real model).
        Assert.Equal("author_id", authorFk.GetColumnName());
    }

    [Fact]
    public void ApplySnakeCaseNaming_uses_fk_prefix_for_foreign_key_constraints_P1()
    {
        using var ctx = BuildRelationalContext();

        var post = ctx.Model.FindEntityType(typeof(BlogPost))!;
        var fk = post.GetForeignKeys().Single();

        // Convention: fk_{dependent_table}_{principal_table}.
        Assert.Equal("fk_blog_post_author", fk.GetConstraintName());
    }

    [Fact]
    public void ApplySnakeCaseNaming_uses_uk_prefix_for_unique_indexes_P1()
    {
        using var ctx = BuildRelationalContext();

        var author = ctx.Model.FindEntityType(typeof(Author))!;
        var uniqueIndex = author.GetIndexes().Single(i => i.IsUnique);

        Assert.Equal("uk_author_display_name", uniqueIndex.GetDatabaseName());
    }

    [Fact]
    public void ApplySnakeCaseNaming_uses_ix_prefix_for_non_unique_indexes_P1()
    {
        using var ctx = BuildRelationalContext();

        var post = ctx.Model.FindEntityType(typeof(BlogPost))!;
        var index = post.GetIndexes().Single(i => !i.IsUnique);

        Assert.Equal("ix_blog_post_title", index.GetDatabaseName());
    }

    [Fact]
    public void ApplySnakeCaseNaming_uses_pk_prefix_for_primary_keys_P1()
    {
        using var ctx = BuildRelationalContext();

        var author = ctx.Model.FindEntityType(typeof(Author))!;
        var primaryKey = author.FindPrimaryKey()!;

        Assert.Equal("pk_author", primaryKey.GetName());
    }

    [Fact]
    public void ApplySnakeCaseNaming_is_safe_to_apply_twice_P0()
    {
        // Regression guard: idempotency at the model level. If a future story
        // accidentally calls ApplySnakeCaseNaming twice (e.g. by chaining
        // conventions), tables must not become "blog__post" or similar corruption.
        var options = new DbContextOptionsBuilder<RelationalDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        using var ctx = new RelationalDbContext(options);

        // Force a second application after the first (which OnModelCreating already did).
        var modelBuilder = new ModelBuilder();
        modelBuilder.Entity<Author>();
        modelBuilder.ApplySnakeCaseNaming();
        modelBuilder.ApplySnakeCaseNaming(); // second pass on a fresh builder

        var authorTable = modelBuilder.Model.FindEntityType(typeof(Author))!.GetTableName();
        Assert.Equal("author", authorTable);
        Assert.DoesNotContain("__", authorTable);
    }
}
