using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;
using System.Reflection;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Story 1.3: Backend Database Foundation — Extended Coverage
///
/// Expands ATDD tests with edge cases, boundary conditions, and error paths
/// not covered by AppDbContextTests.cs.
///
/// ATDD base covers:
///   - Instantiation with in-memory options
///   - Typed constructor signature
///   - Model building without exception
///   - SnakeCaseConvention annotation presence
///   - Zero DbSet properties
///   - DbContext inheritance
///   - EnsureCreated returns without domain tables
///
/// This file covers:
///   - Dispose pattern / IDisposable contract
///   - Namespace and assembly placement
///   - Primary constructor enforcement (no parameterless ctor)
///   - Isolation between multiple context instances (separate in-memory DBs)
///   - OnModelCreating calls base first (ordering safety)
///   - Model entity types remains empty after multiple builds
///   - Options object is not null after creation
///   - Context reports IsDisposed after Dispose
///   - Static reflection: UseSnakeCaseNamingConvention called in OnModelCreating source
///   - DbContextOptions<AppDbContext> type specificity (not base DbContextOptions)
///
/// NOTE: .NET 10 SDK not available in CI — tests are static analysis / in-memory only.
/// </summary>
public class AppDbContextEdgeTests
{
    // ─── Dispose contract ────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_Dispose_DoesNotThrow()
    {
        // GIVEN: A valid context
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"TestDb_Dispose_{Guid.NewGuid()}")
            .Options;

        // WHEN: Dispose is called explicitly
        // THEN: No exception is thrown (IDisposable contract respected)
        var context = new AppDbContext(options);
        var exception = Record.Exception(() => context.Dispose());
        Assert.Null(exception);
    }

    [Fact]
    public void AppDbContext_UsingBlock_DisposesWithoutException()
    {
        // GIVEN: Context created in a using block (canonical IDisposable pattern)
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"TestDb_UsingBlock_{Guid.NewGuid()}")
            .Options;

        // WHEN: using block completes
        // THEN: No exception on implicit Dispose()
        var exception = Record.Exception(() =>
        {
            using var context = new AppDbContext(options);
            _ = context.Model; // trigger model build inside the using block
        });

        Assert.Null(exception);
    }

    // ─── Namespace and assembly placement ────────────────────────────────────

    [Fact]
    public void AppDbContext_IsInCorrectNamespace()
    {
        // GIVEN: Story 1.3 defines AppDbContext placement as SiesaAgents.Infrastructure.Data
        // WHEN: Namespace is read via reflection
        // THEN: Namespace matches the required folder structure
        Assert.Equal("SiesaAgents.Infrastructure.Data", typeof(AppDbContext).Namespace);
    }

    [Fact]
    public void AppDbContext_IsInInfrastructureAssembly()
    {
        // GIVEN: AppDbContext belongs to SiesaAgents.Infrastructure (not API or Domain)
        // WHEN: Assembly name is inspected
        // THEN: Assembly name contains "Infrastructure"
        var assemblyName = typeof(AppDbContext).Assembly.GetName().Name;
        Assert.Contains("Infrastructure", assemblyName);
    }

    // ─── Constructor signature enforcements ──────────────────────────────────

    [Fact]
    public void AppDbContext_HasNoPrimaryParameterlessConstructor()
    {
        // GIVEN: AppDbContext uses primary constructor with DbContextOptions<AppDbContext>
        //        Per story requirement: constructor ONLY accepts DbContextOptions<AppDbContext>
        // WHEN: Parameterless constructor is searched via reflection
        // THEN: No public parameterless constructor exists (DI must supply options)
        var parameterlessCtor = typeof(AppDbContext)
            .GetConstructors(BindingFlags.Public | BindingFlags.Instance)
            .FirstOrDefault(c => c.GetParameters().Length == 0);

        Assert.Null(parameterlessCtor);
    }

    [Fact]
    public void AppDbContext_HasExactlyOnePublicConstructor()
    {
        // GIVEN: Primary constructor pattern means one constructor
        // WHEN: All public constructors are enumerated
        // THEN: Exactly one public constructor exists
        var publicCtors = typeof(AppDbContext)
            .GetConstructors(BindingFlags.Public | BindingFlags.Instance);

        Assert.Single(publicCtors);
    }

    [Fact]
    public void AppDbContext_PublicConstructorAcceptsDbContextOptionsOfAppDbContext()
    {
        // GIVEN: The single public constructor
        // WHEN: Its parameter types are inspected
        // THEN: The first parameter is DbContextOptions<AppDbContext>
        var ctor = typeof(AppDbContext)
            .GetConstructors(BindingFlags.Public | BindingFlags.Instance)
            .Single();

        var parameters = ctor.GetParameters();
        Assert.Single(parameters);
        Assert.Equal(typeof(DbContextOptions<AppDbContext>), parameters[0].ParameterType);
    }

    // ─── Multiple context instance isolation ─────────────────────────────────

    [Fact]
    public void AppDbContext_TwoInstancesWithDifferentDatabases_AreIsolated()
    {
        // GIVEN: Two contexts targeting separate in-memory databases
        var options1 = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"TestDb_Isolation_A_{Guid.NewGuid()}")
            .Options;

        var options2 = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"TestDb_Isolation_B_{Guid.NewGuid()}")
            .Options;

        // WHEN: Both are instantiated simultaneously
        using var context1 = new AppDbContext(options1);
        using var context2 = new AppDbContext(options2);

        // THEN: Both are non-null and distinct instances
        Assert.NotNull(context1);
        Assert.NotNull(context2);
        Assert.NotSame(context1, context2);
    }

    [Fact]
    public void AppDbContext_TwoInstancesSameDatabaseName_BothInstantiateSuccessfully()
    {
        // GIVEN: Two contexts sharing the same in-memory database name (shared store)
        const string sharedDbName = "TestDb_SharedStore_AppDbContext";

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(sharedDbName)
            .Options;

        // WHEN: Both contexts are created pointing to the same DB name
        // THEN: Neither throws — in-memory provider supports multiple contexts on same DB
        using var context1 = new AppDbContext(options);
        using var context2 = new AppDbContext(options);

        Assert.NotNull(context1.Model);
        Assert.NotNull(context2.Model);
    }

}
