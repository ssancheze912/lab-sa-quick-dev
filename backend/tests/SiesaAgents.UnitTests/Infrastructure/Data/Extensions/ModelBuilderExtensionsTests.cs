using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data.Extensions;

namespace SiesaAgents.UnitTests.Infrastructure.Data.Extensions;

/// <summary>
/// Story 1.3 AC #3 — expands ATDD coverage for <c>ModelBuilderExtensions.ApplySnakeCaseNaming()</c>.
///
/// The real <see cref="SiesaAgents.Infrastructure.Data.AppDbContext"/> has zero <c>DbSet&lt;&gt;</c>
/// properties in this story (see scope note — no domain entities until Epic 2/3), so the ATDD
/// integration tests (<c>AppDbContextMigrationTests</c>) can only verify the naming convention
/// indirectly via the <c>__ef_migrations_history</c> table, which is built outside
/// <c>OnModelCreating</c>'s model entirely. The actual rename logic inside
/// <c>ApplySnakeCaseNaming()</c> — table names, column names, primary key names, foreign key
/// constraint names, and index names — is therefore completely unexercised by any ATDD test.
///
/// These unit tests close that gap using a throwaway, test-only model (never touches a real
/// database — <c>DbContext.Model</c> triggers EF Core's model-building pipeline, including
/// <c>OnModelCreating</c>, without opening a connection).
/// </summary>
public class ModelBuilderExtensionsTests
{
    [Fact]
    public void ApplySnakeCaseNaming_WithNoEntityTypes_DoesNotThrow()
    {
        // GIVEN a model with zero registered entity types (mirrors the real AppDbContext in this story)
        using var context = new EmptyModelDbContext();

        // WHEN the model is built (triggers OnModelCreating -> ApplySnakeCaseNaming)
        var exception = Record.Exception(() => _ = context.Model);

        // THEN no exception is thrown — the loop body never executes, safe no-op
        Assert.Null(exception);
    }

    [Fact]
    public void ApplySnakeCaseNaming_WithPascalCaseEntityName_SetsSnakeCaseTableName()
    {
        // GIVEN a model whose default table name is derived from the "SampleParents" DbSet property
        using var context = new SampleModelDbContext();

        // WHEN the model is built
        var entity = context.Model.FindEntityType(typeof(SampleParent))!;

        // THEN the table name is converted to snake_case
        Assert.Equal("sample_parents", entity.GetTableName());
    }

    [Fact]
    public void ApplySnakeCaseNaming_WithPascalCaseProperty_SetsSnakeCaseColumnName()
    {
        // GIVEN a model with a PascalCase property ("DisplayName")
        using var context = new SampleModelDbContext();
        var entity = context.Model.FindEntityType(typeof(SampleParent))!;

        // WHEN the model is built
        var property = entity.FindProperty(nameof(SampleParent.DisplayName))!;

        // THEN the column name is converted to snake_case
        Assert.Equal("display_name", property.GetColumnName());
    }

    [Fact]
    public void ApplySnakeCaseNaming_WithPrimaryKey_SetsSnakeCaseKeyName()
    {
        // GIVEN a model where the primary key is built from a PascalCase property name
        using var context = new SampleModelDbContext();
        var entity = context.Model.FindEntityType(typeof(SampleParent))!;

        // WHEN the model is built
        var key = entity.FindPrimaryKey()!;
        var keyName = key.GetName()!;

        // THEN the key constraint name is converted to snake_case: entirely lower-case
        // and actually derived from the entity (not just coincidentally already lower-case)
        Assert.Equal(keyName.ToLowerInvariant(), keyName);
        Assert.Contains("sample_parent", keyName);
    }

    [Fact]
    public void ApplySnakeCaseNaming_WithForeignKey_SetsSnakeCaseConstraintName()
    {
        // GIVEN a model with a foreign key relationship (SampleChild -> SampleParent)
        using var context = new SampleModelDbContext();
        var entity = context.Model.FindEntityType(typeof(SampleChild))!;

        // WHEN the model is built
        var foreignKey = Assert.Single(entity.GetForeignKeys());
        var constraintName = foreignKey.GetConstraintName()!;

        // THEN the FK constraint name is entirely lower-case (snake_case), never PascalCase
        Assert.Equal(constraintName.ToLowerInvariant(), constraintName);
    }

    [Fact]
    public void ApplySnakeCaseNaming_WithIndex_SetsSnakeCaseDatabaseName()
    {
        // GIVEN a model with an explicit index configured on a PascalCase property ("ChildName")
        // (the entity also has an EF-convention index on the FK property, so there are 2 indexes total)
        using var context = new SampleModelDbContext();
        var entity = context.Model.FindEntityType(typeof(SampleChild))!;

        // WHEN the model is built
        var index = entity.GetIndexes().Single(i => i.Properties.Any(p => p.Name == nameof(SampleChild.ChildName)));

        // THEN the index database name is converted to snake_case
        Assert.Equal("ix_sample_children_child_name", index.GetDatabaseName());
    }

    [Fact]
    public void ApplySnakeCaseNaming_WithForeignKeyConventionIndex_SetsSnakeCaseDatabaseName()
    {
        // GIVEN a model where EF's convention auto-creates an index on the FK property ("SampleParentId")
        using var context = new SampleModelDbContext();
        var entity = context.Model.FindEntityType(typeof(SampleChild))!;

        // WHEN the model is built
        var index = entity.GetIndexes().Single(i => i.Properties.Any(p => p.Name == nameof(SampleChild.SampleParentId)));

        // THEN the auto-generated FK index name is also converted to snake_case
        Assert.Equal(index.GetDatabaseName()!.ToLowerInvariant(), index.GetDatabaseName());
    }

    [Fact]
    public void ApplySnakeCaseNaming_WithAlreadySnakeCaseColumnName_RemainsUnchanged()
    {
        // GIVEN a property explicitly mapped to an already-snake_case column name
        using var context = new SampleModelDbContext();
        var entity = context.Model.FindEntityType(typeof(SampleChild))!;

        // WHEN the model is built
        var property = entity.FindProperty(nameof(SampleChild.AlreadySnakeCase))!;

        // THEN the pre-existing snake_case name is idempotent (no double-conversion, no corruption)
        Assert.Equal("already_snake_case", property.GetColumnName());
    }

    [Fact]
    public void ApplySnakeCaseNaming_WithMultipleEntityTypes_RenamesEveryEntity()
    {
        // GIVEN a model with more than one registered entity type
        using var context = new SampleModelDbContext();

        // WHEN the model is built
        var tableNames = context.Model.GetEntityTypes().Select(e => e.GetTableName()).ToList();

        // THEN every entity's table name was renamed to snake_case (loop covers all entities, not just the first)
        Assert.Equal(new[] { "sample_children", "sample_parents" }, tableNames.OrderBy(n => n));
    }

    private class SampleParent
    {
        public Guid SampleParentId { get; set; }

        public string DisplayName { get; set; } = string.Empty;

        public ICollection<SampleChild> SampleChildren { get; set; } = new List<SampleChild>();
    }

    private class SampleChild
    {
        public Guid SampleChildId { get; set; }

        public string ChildName { get; set; } = string.Empty;

        public string AlreadySnakeCase { get; set; } = string.Empty;

        public Guid SampleParentId { get; set; }

        public SampleParent? SampleParent { get; set; }
    }

    /// <summary>
    /// Never opened — <c>DbContext.Model</c> triggers EF Core's model-building pipeline
    /// (including <see cref="OnModelCreating"/>) purely in-memory, without a real connection.
    /// </summary>
    private class SampleModelDbContext : DbContext
    {
        public DbSet<SampleParent> SampleParents => Set<SampleParent>();

        public DbSet<SampleChild> SampleChildren => Set<SampleChild>();

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder) =>
            optionsBuilder.UseNpgsql("Host=localhost;Database=model_build_only_never_opened;Username=test;Password=test");

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<SampleChild>(builder =>
            {
                builder.Property(c => c.AlreadySnakeCase).HasColumnName("already_snake_case");
                builder.HasIndex(c => c.ChildName);
            });

            // MUST remain the last call — matches the real AppDbContext.OnModelCreating pattern
            modelBuilder.ApplySnakeCaseNaming();
        }
    }

    private class EmptyModelDbContext : DbContext
    {
        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder) =>
            optionsBuilder.UseNpgsql("Host=localhost;Database=model_build_only_empty;Username=test;Password=test");

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.ApplySnakeCaseNaming();
        }
    }
}
