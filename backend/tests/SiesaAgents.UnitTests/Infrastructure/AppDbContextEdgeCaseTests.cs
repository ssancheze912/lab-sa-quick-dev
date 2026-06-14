using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Edge case and boundary tests for AppDbContext (Story 1.3).
/// Expands coverage beyond ATDD phase — covers constructor guards,
/// disposal semantics, model idempotency, and InMemory provider limits.
/// </summary>
public class AppDbContextEdgeCaseTests
{
    // -------------------------------------------------------------------------
    // Boundary: Multiple EnsureCreated calls are idempotent
    // -------------------------------------------------------------------------

    [Fact]
    public void EnsureCreated_CalledTwiceOnSameDatabase_DoesNotThrow()
    {
        // GIVEN: An InMemory database already created
        var dbName = $"TestDb_IdempotentCreate_{Guid.NewGuid()}";
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        // WHEN: EnsureCreated is called twice on the same logical database
        // THEN: No exception — InMemory provider handles this gracefully
        var exception = Record.Exception(() =>
        {
            using var ctx1 = new AppDbContext(options);
            ctx1.Database.EnsureCreated();

            using var ctx2 = new AppDbContext(options);
            ctx2.Database.EnsureCreated();
        });

        Assert.Null(exception);
    }

    // -------------------------------------------------------------------------
    // Boundary: Each unique InMemory database name is isolated
    // -------------------------------------------------------------------------

    [Fact]
    public void AppDbContext_TwoDifferentDatabaseNames_AreIsolated()
    {
        // GIVEN: Two AppDbContext instances pointing to different InMemory databases
        var options1 = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"IsolatedDb_A_{Guid.NewGuid()}")
            .Options;

        var options2 = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"IsolatedDb_B_{Guid.NewGuid()}")
            .Options;

        // WHEN: Both contexts are instantiated and created
        // THEN: Both succeed independently without interfering with each other
        using var ctx1 = new AppDbContext(options1);
        using var ctx2 = new AppDbContext(options2);

        var exception = Record.Exception(() =>
        {
            ctx1.Database.EnsureCreated();
            ctx2.Database.EnsureCreated();
        });

        Assert.Null(exception);
    }

    // -------------------------------------------------------------------------
    // Boundary: Model is accessible after EnsureCreated (model building is stable)
    // -------------------------------------------------------------------------

    [Fact]
    public void Model_AfterEnsureCreated_IsStableAndNotNull()
    {
        // GIVEN: AppDbContext configured with InMemory provider
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_ModelStable_{Guid.NewGuid()}")
            .Options;

        // WHEN: EnsureCreated is called and model is accessed
        using var context = new AppDbContext(options);
        context.Database.EnsureCreated();

        // THEN: The model is non-null and accessible
        var model = context.Model;
        Assert.NotNull(model);
    }

    // -------------------------------------------------------------------------
    // Boundary: Entity types list must be empty (no domain entities at Story 1.3)
    // -------------------------------------------------------------------------

    [Fact]
    public void Model_EntityTypes_CountIsZero_BeforeDomainEntitiesAdded()
    {
        // GIVEN: AppDbContext with InMemory provider — no DbSet<> properties defined
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_EmptyModel_{Guid.NewGuid()}")
            .Options;

        // WHEN: Model is inspected
        using var context = new AppDbContext(options);
        context.Database.EnsureCreated();

        var entityTypes = context.Model.GetEntityTypes().ToList();

        // THEN: Zero entity types exist — scope boundary (Epics 2 and 3 add domain entities)
        Assert.Empty(entityTypes);
    }

    // -------------------------------------------------------------------------
    // Boundary: Dispose does not throw — context is disposable
    // -------------------------------------------------------------------------

    [Fact]
    public void AppDbContext_Dispose_DoesNotThrow()
    {
        // GIVEN: A fully instantiated AppDbContext
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_Dispose_{Guid.NewGuid()}")
            .Options;

        // WHEN: The context is disposed explicitly
        // THEN: No exception is thrown during disposal
        var exception = Record.Exception(() =>
        {
            var context = new AppDbContext(options);
            context.Dispose();
        });

        Assert.Null(exception);
    }

    // -------------------------------------------------------------------------
    // Boundary: Using pattern (IDisposable) works correctly
    // -------------------------------------------------------------------------

    [Fact]
    public void AppDbContext_UsedInUsingBlock_DisposesWithoutError()
    {
        // GIVEN: A using block wrapping AppDbContext
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_UsingBlock_{Guid.NewGuid()}")
            .Options;

        // WHEN: The context exits the using block
        // THEN: No exception during create, use, or dispose
        var exception = Record.Exception(() =>
        {
            using var context = new AppDbContext(options);
            context.Database.EnsureCreated();
            var model = context.Model;
            Assert.NotNull(model);
        }); // dispose happens here

        Assert.Null(exception);
    }

    // -------------------------------------------------------------------------
    // Boundary: AppDbContext inherits from DbContext (correct base class)
    // -------------------------------------------------------------------------

    [Fact]
    public void AppDbContext_IsAssignableFromDbContext()
    {
        // GIVEN: The type AppDbContext
        // WHEN: Type hierarchy is inspected
        // THEN: AppDbContext is a DbContext (Clean Architecture EF Core contract)
        Assert.True(typeof(DbContext).IsAssignableFrom(typeof(AppDbContext)));
    }

    // -------------------------------------------------------------------------
    // Boundary: DbContextOptions<AppDbContext> is type-safe (not DbContextOptions<DbContext>)
    // -------------------------------------------------------------------------

    [Fact]
    public void AppDbContext_OptionsBuilder_ProducesTypedOptions()
    {
        // GIVEN: A typed DbContextOptionsBuilder<AppDbContext>
        var builder = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_TypedOptions_{Guid.NewGuid()}");

        // WHEN: Options are built
        var options = builder.Options;

        // THEN: Options type is DbContextOptions<AppDbContext> (not base type)
        Assert.IsType<DbContextOptions<AppDbContext>>(options);
    }

    // -------------------------------------------------------------------------
    // Error path: Verify no domain-specific entity types (additional forbidden types)
    // -------------------------------------------------------------------------

    [Theory]
    [InlineData("Agent")]
    [InlineData("User")]
    [InlineData("Conversation")]
    [InlineData("Message")]
    public void Model_DoesNotContainFutureEpicEntityTypes_InInitialMigration(string forbiddenTypeName)
    {
        // GIVEN: AppDbContext in its initial state (Story 1.3 — no domain entities)
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_NoFutureEntities_{forbiddenTypeName}_{Guid.NewGuid()}")
            .Options;

        // WHEN: Model entity types are inspected
        using var context = new AppDbContext(options);
        context.Database.EnsureCreated();

        var entityTypes = context.Model.GetEntityTypes().ToList();

        // THEN: None of the future Epic entity types exist yet
        Assert.DoesNotContain(entityTypes, et =>
            et.ClrType.Name.Contains(forbiddenTypeName, StringComparison.OrdinalIgnoreCase));
    }
}
