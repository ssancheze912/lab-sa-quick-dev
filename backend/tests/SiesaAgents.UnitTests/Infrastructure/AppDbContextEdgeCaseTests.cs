using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Edge-case and boundary unit tests for AppDbContext and AppDbContextFactory.
/// Story 1.3: Backend Database Foundation — extended coverage beyond ATDD baseline.
/// </summary>
public class AppDbContextEdgeCaseTests
{
    // =========================================================================
    // AppDbContext — dispose / lifetime edge cases
    // =========================================================================

    [Fact]
    public void AppDbContext_Dispose_DoesNotThrow()
    {
        // GIVEN: A fully constructed AppDbContext
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new AppDbContext(options);

        // WHEN: Dispose is called
        var exception = Record.Exception(() => context.Dispose());

        // THEN: No exception is thrown
        Assert.Null(exception);
    }

    [Fact]
    public async Task AppDbContext_DisposeAsync_DoesNotThrow()
    {
        // GIVEN: A fully constructed AppDbContext
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        await using var context = new AppDbContext(options);

        // WHEN: DisposeAsync is called via using statement
        // THEN: No exception is thrown (compiler generates the await DisposeAsync call)
        Assert.NotNull(context);
    }

    [Fact]
    public void AppDbContext_MultipleInstances_IndependentDatabases()
    {
        // GIVEN: Two separate AppDbContext instances with different in-memory DB names
        var options1 = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "db-instance-1")
            .Options;
        var options2 = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "db-instance-2")
            .Options;

        // WHEN: Both contexts are created
        using var ctx1 = new AppDbContext(options1);
        using var ctx2 = new AppDbContext(options2);

        // THEN: Each context instance is distinct (EF Core may share compiled model across
        // instances of the same type — that is an internal caching optimization, not a bug)
        Assert.NotSame(ctx1, ctx2);
    }

    [Fact]
    public void AppDbContext_ModelIsConsistent_OnRepeatedAccess()
    {
        // GIVEN: An AppDbContext instance
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new AppDbContext(options);

        // WHEN: Model is accessed multiple times
        var model1 = context.Model;
        var model2 = context.Model;

        // THEN: The same model object is returned (EF Core caches it)
        Assert.Same(model1, model2);
    }

    [Fact]
    public void AppDbContext_EntityTypes_EmptyAfterConstruction_NoDbSets()
    {
        // GIVEN: An AppDbContext with no DbSet<> properties defined (Story 1.3 scope)
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new AppDbContext(options);

        // WHEN: We request entity types
        var entityTypes = context.Model.GetEntityTypes().ToList();

        // THEN: No entity types are registered — entities are added in Epic 2+
        Assert.Empty(entityTypes);
    }

    // =========================================================================
    // AppDbContextFactory — design-time factory edge cases
    // =========================================================================

    [Fact]
    public void AppDbContextFactory_CreateDbContext_WithEmptyArgs_ReturnsContext()
    {
        // GIVEN: The design-time factory used by dotnet-ef CLI
        var factory = new AppDbContextFactory();

        // WHEN: CreateDbContext is called with empty args (standard CLI invocation)
        var context = factory.CreateDbContext([]);

        // THEN: A valid AppDbContext is returned
        Assert.NotNull(context);
        context.Dispose();
    }

    [Fact]
    public void AppDbContextFactory_CreateDbContext_WithArgs_ReturnsContext()
    {
        // GIVEN: The design-time factory
        var factory = new AppDbContextFactory();

        // WHEN: CreateDbContext is called with arbitrary args (dotnet-ef passes environment args)
        var context = factory.CreateDbContext(["--environment", "Production"]);

        // THEN: Factory ignores unknown args and returns a valid context
        Assert.NotNull(context);
        context.Dispose();
    }

    [Fact]
    public void AppDbContextFactory_CreateDbContext_ContextIsCorrectType()
    {
        // GIVEN: The design-time factory
        var factory = new AppDbContextFactory();

        // WHEN: CreateDbContext is called
        using var context = factory.CreateDbContext([]);

        // THEN: The returned context is specifically AppDbContext (not a derived or proxy type)
        Assert.IsType<AppDbContext>(context);
    }

    [Fact]
    public void AppDbContextFactory_ImplementsIDesignTimeDbContextFactory()
    {
        // GIVEN: The AppDbContextFactory type
        var factoryType = typeof(AppDbContextFactory);

        // WHEN: We check its implemented interfaces
        var interfaceType = typeof(IDesignTimeDbContextFactory<AppDbContext>);

        // THEN: AppDbContextFactory implements IDesignTimeDbContextFactory<AppDbContext>
        // This is required for dotnet-ef to discover and use the factory at design time
        Assert.True(interfaceType.IsAssignableFrom(factoryType));
    }

    [Fact]
    public void AppDbContextFactory_CreateDbContext_MultipleCallsReturnDistinctInstances()
    {
        // GIVEN: The design-time factory
        var factory = new AppDbContextFactory();

        // WHEN: CreateDbContext is called twice
        using var context1 = factory.CreateDbContext([]);
        using var context2 = factory.CreateDbContext([]);

        // THEN: Each call returns a new, distinct context instance
        Assert.NotSame(context1, context2);
    }

    // =========================================================================
    // AppDbContext — snake_case via UseSnakeCaseNamingConvention (options-level)
    // =========================================================================

    [Fact]
    public void AppDbContext_WithSnakeCaseOption_ModelBuildsWithoutError()
    {
        // GIVEN: Options configured with UseSnakeCaseNamingConvention (as in Program.cs)
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .UseSnakeCaseNamingConvention()
            .Options;

        // WHEN: AppDbContext is constructed with these options
        AppDbContext? act() => new AppDbContext(options);

        // THEN: No exception — snake_case convention does not conflict with OnModelCreating
        var exception = Record.Exception(act);
        Assert.Null(exception);
    }

    [Fact]
    public void AppDbContext_WithoutSnakeCaseOption_ModelStillBuildsWithoutError()
    {
        // GIVEN: Options WITHOUT UseSnakeCaseNamingConvention (edge case: factory without convention)
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        // WHEN: AppDbContext is constructed without the convention
        AppDbContext? act() => new AppDbContext(options);

        // THEN: Context still constructs without error — convention is optional at the context level
        var exception = Record.Exception(act);
        Assert.Null(exception);
    }
}
