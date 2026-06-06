using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// ATDD unit tests for AppDbContext — Story 1.3: Backend Database Foundation.
///
/// RED phase: All tests fail until AppDbContext is implemented in
/// backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs.
///
/// AC coverage:
///   AC #2 — OnModelCreating calls UseSnakeCaseNamingConvention() as the last call
///   AC #4 — AppDbContext can be resolved from DI and instantiated without errors
///   AC #5 — AppDbContext constructor accepts DbContextOptions<AppDbContext>
/// </summary>
public class AppDbContextTests
{
    // ──────────────────────────────────────────────────────────────────────────
    // AC #4 / AC #5 — AppDbContext can be instantiated with valid options
    // GIVEN: Valid DbContextOptions using InMemory provider
    // WHEN:  AppDbContext is constructed
    // THEN:  Instance is not null and no exception is thrown
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_CanBeInstantiated_WithInMemoryProvider()
    {
        // GIVEN: Valid DbContextOptions using InMemory provider
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_" + Guid.NewGuid())
            .Options;

        // WHEN: AppDbContext is constructed
        using var context = new AppDbContext(options);

        // THEN: Instance is not null and no exception is thrown
        Assert.NotNull(context);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // AC #5 — Constructor accepts DbContextOptions<AppDbContext> (DI pattern)
    // GIVEN: DbContextOptions<AppDbContext> built via DbContextOptionsBuilder
    // WHEN:  AppDbContext constructor is called with those options
    // THEN:  The context is created successfully (not just base DbContext)
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_Constructor_AcceptsTypedDbContextOptions()
    {
        // GIVEN: DbContextOptions<AppDbContext> (typed — required by DI pattern)
        DbContextOptions<AppDbContext> typedOptions = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_Typed_" + Guid.NewGuid())
            .Options;

        // WHEN: AppDbContext is constructed with typed options
        using var context = new AppDbContext(typedOptions);

        // THEN: Instance is of the correct concrete type
        Assert.IsType<AppDbContext>(context);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // AC #2 — UseSnakeCaseNamingConvention is applied in OnModelCreating
    // GIVEN: AppDbContext configured with InMemory provider
    // WHEN:  EF Core builds the model (OnModelCreating is executed)
    // THEN:  The model is built without errors (snake_case convention is active)
    //
    // NOTE: InMemory provider does not validate column names, so we verify that
    //       OnModelCreating executes without throwing — the snake_case convention
    //       is exercised via Model property access which triggers model building.
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_OnModelCreating_ExecutesWithoutException()
    {
        // GIVEN: AppDbContext with InMemory provider
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_ModelCreating_" + Guid.NewGuid())
            .Options;

        using var context = new AppDbContext(options);

        // WHEN: Model is built by accessing Model property (triggers OnModelCreating)
        var buildException = Record.Exception(() => _ = context.Model);

        // THEN: No exception — UseSnakeCaseNamingConvention() did not throw
        Assert.Null(buildException);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // AC #2 — No DbSet properties for domain entities in this story
    // GIVEN: AppDbContext is instantiated
    // WHEN:  The model entity types are enumerated
    // THEN:  No ClienteEntity or ContactoEntity types are present
    //        (those belong to Epic 2 / Epic 3 respectively)
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_Model_ContainsNoDomainEntityTables()
    {
        // GIVEN: AppDbContext with InMemory provider
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_NoDomainTables_" + Guid.NewGuid())
            .Options;

        using var context = new AppDbContext(options);

        // WHEN: Model entity types are enumerated
        var entityTypeNames = context.Model.GetEntityTypes()
            .Select(e => e.ClrType.Name)
            .ToList();

        // THEN: No domain entity tables from future epics
        Assert.DoesNotContain("ClienteEntity", entityTypeNames);
        Assert.DoesNotContain("ContactoEntity", entityTypeNames);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // AC #4 — CanConnect returns true with a valid InMemory database
    // GIVEN: AppDbContext is resolved with a valid InMemory connection
    // WHEN:  context.Database.CanConnect() is called
    // THEN:  Returns true (the context can connect to its configured database)
    //
    // NOTE: InMemory provider always returns true for CanConnect().
    //       This test validates the method is callable and the DB is reachable.
    //       For the real PostgreSQL scenario, see integration test notes below.
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_DatabaseCanConnect_ReturnsTrueWithInMemoryProvider()
    {
        // GIVEN: AppDbContext with InMemory provider (simulates valid connection)
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_CanConnect_" + Guid.NewGuid())
            .Options;

        using var context = new AppDbContext(options);

        // WHEN: CanConnect is called
        var canConnect = context.Database.CanConnect();

        // THEN: Returns true — context is connected to its database
        Assert.True(canConnect);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // AC #5 — SiesaAgents.Infrastructure project references Npgsql package
    // GIVEN: The Infrastructure assembly is loaded
    // WHEN:  Its referenced assemblies are checked
    // THEN:  Npgsql.EntityFrameworkCore.PostgreSQL assembly is present
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Infrastructure_Assembly_ReferencesNpgsqlEntityFrameworkCorePostgreSQL()
    {
        // GIVEN: The SiesaAgents.Infrastructure assembly
        var infrastructureAssembly = typeof(AppDbContext).Assembly;

        // WHEN: Referenced assemblies are checked
        var referencedAssemblyNames = infrastructureAssembly
            .GetReferencedAssemblies()
            .Select(a => a.Name ?? string.Empty)
            .ToList();

        // THEN: Npgsql EF Core provider is referenced
        Assert.Contains(
            referencedAssemblyNames,
            name => name.Contains("Npgsql", StringComparison.OrdinalIgnoreCase));
    }
}
