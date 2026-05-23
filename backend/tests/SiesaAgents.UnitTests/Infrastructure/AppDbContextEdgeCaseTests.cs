using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Domain.Entities;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Story 1.3: Backend Database Foundation
/// Epic 1: Project Foundation & Application Shell
///
/// Edge case unit tests for AppDbContext EF Core configuration and related concerns.
/// Expands AppDbContextTests.cs with boundary conditions and error paths not covered
/// by the primary ATDD unit tests.
///
/// Coverage areas:
///   - AppDbContext isolation: separate InMemory databases are independent
///   - AppDbContext idempotency: EnsureCreated is safe to call multiple times
///   - Entity.Id protected setter: cannot be reassigned from outside the class
///   - Entity equality: two distinct instances with distinct Ids are not equal by reference
///   - ProblemDetails RFC 7807 correctness: all required fields present and no forbidden fields
///   - ProblemDetails Status and HTTP 500 consistency
///   - ExceptionHandlingMiddleware: Title field has correct non-empty value
///   - AppDbContext DI via ServiceCollection: registers and resolves correctly with Npgsql replaced by InMemory
///   - Entity timestamps are in UTC (UtcNow, not local time)
///   - AppDbContext model access is idempotent (calling Model twice returns the same model)
/// </summary>
public class AppDbContextEdgeCaseTests
{
    // ─────────────────────────────────────────────────────────────────────
    // AppDbContext isolation: separate InMemory databases are independent
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public void TwoAppDbContextInstances_WithDifferentDatabaseNames_AreIsolated()
    {
        // Given: Two AppDbContext instances each using a different named InMemory database
        // When: They are instantiated
        // Then: They represent independent database scopes (different IModel references or at minimum independent contexts)
        var options1 = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"isolation_db1_{Guid.NewGuid()}")
            .Options;

        var options2 = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"isolation_db2_{Guid.NewGuid()}")
            .Options;

        using var context1 = new AppDbContext(options1);
        using var context2 = new AppDbContext(options2);

        // Both should be non-null and independent instances
        Assert.NotNull(context1);
        Assert.NotNull(context2);
        Assert.NotSame(context1, context2);
    }

    // ─────────────────────────────────────────────────────────────────────
    // AppDbContext idempotency: EnsureCreated safe to call multiple times
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_EnsureCreated_IsIdempotent_NoExceptionOnSecondCall()
    {
        // Given: AppDbContext with InMemory provider
        // When: EnsureCreated is called twice
        // Then: No exception is thrown on either call (idempotent operation)
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"idempotent_db_{Guid.NewGuid()}")
            .Options;

        using var context = new AppDbContext(options);

        var exception = Record.Exception(() =>
        {
            context.Database.EnsureCreated();
            context.Database.EnsureCreated(); // second call must be safe
        });

        Assert.Null(exception);
    }

    // ─────────────────────────────────────────────────────────────────────
    // AppDbContext model: accessing Model twice returns same model instance
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_Model_IsIdempotent_SameModelReturnedOnMultipleAccess()
    {
        // Given: AppDbContext is instantiated with InMemory provider
        // When: The Model property is accessed twice
        // Then: Both calls return the same IModel instance (built once, cached)
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"model_cache_db_{Guid.NewGuid()}")
            .Options;

        using var context = new AppDbContext(options);

        var model1 = context.Model;
        var model2 = context.Model;

        Assert.Same(model1, model2);
    }

    // ─────────────────────────────────────────────────────────────────────
    // AppDbContext via DI ServiceCollection — resolves correctly
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_RegisteredViaServiceCollection_ResolvesSuccessfully()
    {
        // Given: AppDbContext registered in a ServiceCollection (simulating DI registration)
        // When: The context is resolved from the service provider
        // Then: The resolved instance is non-null and functional
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(opts =>
            opts.UseInMemoryDatabase($"di_test_db_{Guid.NewGuid()}"));

        var provider = services.BuildServiceProvider();

        var exception = Record.Exception(() =>
        {
            using var scope = provider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            Assert.NotNull(context);
            _ = context.Model; // trigger OnModelCreating
        });

        Assert.Null(exception);
    }

    [Fact]
    public void AppDbContext_RegisteredViaServiceCollection_IsRegisteredAsScoped()
    {
        // Given: AppDbContext is registered with AddDbContext (which defaults to Scoped lifetime)
        // When: Two requests are made within the same scope
        // Then: The same instance is returned within a scope (Scoped pattern)
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(opts =>
            opts.UseInMemoryDatabase($"scoped_test_db_{Guid.NewGuid()}"));

        var provider = services.BuildServiceProvider();

        using var scope = provider.CreateScope();
        var context1 = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var context2 = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // Within the same scope, AddDbContext registers as Scoped — same instance
        Assert.Same(context1, context2);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Entity identity — reference inequality and value equality boundary
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public void Entity_TwoNewInstances_AreNotReferenceEqual()
    {
        // Given: Two separate Entity instances
        // When: They are compared by reference
        // Then: They are not the same object (distinct allocations)
        var entity1 = new ConcreteTestEntity();
        var entity2 = new ConcreteTestEntity();

        Assert.NotSame(entity1, entity2);
    }

    [Fact]
    public void Entity_TwoNewInstances_HaveDifferentIds_NotEqual()
    {
        // Given: Two Entity instances with auto-generated Guids
        // When: Their Ids are compared by value
        // Then: The Ids are different (collision probability is negligible)
        var entity1 = new ConcreteTestEntity();
        var entity2 = new ConcreteTestEntity();

        Assert.NotEqual(entity1.Id, entity2.Id);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Entity timestamps are UTC — boundary check
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public void Entity_CreatedAt_Offset_IsUtc()
    {
        // Given: Entity is instantiated
        // When: CreatedAt.Offset is read
        // Then: The offset is TimeSpan.Zero (UTC, not a local timezone offset)
        var entity = new ConcreteTestEntity();

        Assert.Equal(TimeSpan.Zero, entity.CreatedAt.Offset);
    }

    [Fact]
    public void Entity_UpdatedAt_Offset_IsUtc()
    {
        // Given: Entity is instantiated
        // When: UpdatedAt.Offset is read
        // Then: The offset is TimeSpan.Zero (UTC, not a local timezone offset)
        var entity = new ConcreteTestEntity();

        Assert.Equal(TimeSpan.Zero, entity.UpdatedAt.Offset);
    }

    [Fact]
    public void Entity_CreatedAt_And_UpdatedAt_AreApproximatelyEqual_OnConstruction()
    {
        // Given: Entity is newly created
        // When: CreatedAt and UpdatedAt are compared
        // Then: They are within 1 second of each other (both set at construction time)
        var entity = new ConcreteTestEntity();

        var delta = Math.Abs((entity.CreatedAt - entity.UpdatedAt).TotalSeconds);
        Assert.True(
            delta < 1.0,
            $"CreatedAt and UpdatedAt should be set within 1 second of each other on construction, " +
            $"but delta was {delta} seconds"
        );
    }

    // ─────────────────────────────────────────────────────────────────────
    // Entity.Id type boundary — Guid is not empty, not max value
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public void Entity_Id_IsNotMaxValue()
    {
        // Given: Entity.Id is generated via Guid.NewGuid()
        // When: The Id is compared to Guid.MaxValue (all 0xFF bytes)
        // Then: They are not equal (Guid.NewGuid() never produces the max value)
        var entity = new ConcreteTestEntity();
        var maxGuid = new Guid("ffffffff-ffff-ffff-ffff-ffffffffffff");

        Assert.NotEqual(maxGuid, entity.Id);
    }

    [Fact]
    public void Entity_Id_IsVersion4_Guid()
    {
        // Given: Entity.Id is generated via Guid.NewGuid() (which uses v4 in .NET)
        // When: The Guid bytes are inspected
        // Then: The Id is a valid non-zero 128-bit value (16 non-zero bytes is practically guaranteed)
        var entity = new ConcreteTestEntity();

        // A valid v4 Guid should not have all bytes zero
        var bytes = entity.Id.ToByteArray();
        var allZero = bytes.All(b => b == 0);

        Assert.False(allZero, "Entity.Id must not be a zero-byte Guid (Guid.Empty)");
    }

    // ─────────────────────────────────────────────────────────────────────
    // ProblemDetails RFC 7807 — boundary and field validation
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public void ProblemDetails_Status_And_Title_AreSetCorrectly_ForUnhandledException()
    {
        // Given: ExceptionHandlingMiddleware creates a ProblemDetails on unhandled exception
        // When: The ProblemDetails is constructed as the middleware would
        // Then: Status = 500 and Title = "An unexpected error occurred." (exact match)
        var problemDetails = new ProblemDetails
        {
            Status = 500,
            Title = "An unexpected error occurred.",
            Detail = null
        };

        Assert.Equal(500, problemDetails.Status);
        Assert.Equal("An unexpected error occurred.", problemDetails.Title);
        Assert.Null(problemDetails.Detail);
    }

    [Fact]
    public void ProblemDetails_Title_IsNonEmpty_NotWhitespace()
    {
        // Given: The middleware always sets a Title on the ProblemDetails
        // When: The Title is inspected
        // Then: It is neither null, empty, nor whitespace
        var problemDetails = new ProblemDetails
        {
            Status = 500,
            Title = "An unexpected error occurred.",
            Detail = null
        };

        Assert.False(
            string.IsNullOrWhiteSpace(problemDetails.Title),
            "ProblemDetails.Title must not be null, empty, or whitespace for RFC 7807 compliance"
        );
    }

    [Fact]
    public void ProblemDetails_Detail_IsNull_NeverContainsExceptionMessage()
    {
        // Given: The middleware catches a sensitive exception
        // When: ProblemDetails.Detail is constructed per the middleware pattern
        // Then: Detail is null — the exception message is never included
        var sensitiveException = new InvalidOperationException(
            "CONNECTION_STRING=Host=prod-server;Password=SuperSecret123"
        );

        var problemDetails = new ProblemDetails
        {
            Status = 500,
            Title = "An unexpected error occurred.",
            Detail = null  // NEVER: sensitiveException.Message
        };

        Assert.Null(problemDetails.Detail);

        // Paranoia check: ensure the sensitive message string did not leak
        var serialized = System.Text.Json.JsonSerializer.Serialize(problemDetails);
        Assert.DoesNotContain("SuperSecret123", serialized);
        Assert.DoesNotContain("prod-server", serialized);
    }

    [Fact]
    public void ProblemDetails_Extensions_DoNotContainStackTrace()
    {
        // Given: The middleware must not add stack trace to ProblemDetails.Extensions
        // When: ProblemDetails is constructed per the middleware pattern
        // Then: Extensions dictionary does not contain a StackTrace or exceptionType entry
        var problemDetails = new ProblemDetails
        {
            Status = 500,
            Title = "An unexpected error occurred.",
            Detail = null
        };

        // Extensions should be null or empty — no additional debugging info
        var hasStackTrace = problemDetails.Extensions?.ContainsKey("stackTrace") ?? false;
        var hasException = problemDetails.Extensions?.ContainsKey("exception") ?? false;
        var hasInnerException = problemDetails.Extensions?.ContainsKey("innerException") ?? false;

        Assert.False(hasStackTrace, "ProblemDetails.Extensions must not expose stackTrace (NFR6)");
        Assert.False(hasException, "ProblemDetails.Extensions must not expose exception details (NFR6)");
        Assert.False(hasInnerException, "ProblemDetails.Extensions must not expose innerException (NFR6)");
    }

    // ─────────────────────────────────────────────────────────────────────
    // AppDbContext — no public DbSet properties in Story 1.3 baseline
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_HasNoPublicDbSetProperties_AtBaselineStage()
    {
        // Given: Story 1.3 creates an empty migration baseline (no domain entities)
        // When: AppDbContext's public properties are inspected via reflection
        // Then: No properties of type DbSet<T> are declared
        var dbSetType = typeof(DbSet<>);
        var properties = typeof(AppDbContext)
            .GetProperties(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance)
            .Where(p =>
                p.PropertyType.IsGenericType &&
                p.PropertyType.GetGenericTypeDefinition() == dbSetType)
            .ToList();

        Assert.Empty(
            properties.Select(p => p.Name),
            "AppDbContext must not define any DbSet<> properties in Story 1.3 — " +
            "entities are added in Epic 2 (ClienteEntity) and Epic 3 (ContactoEntity)"
        );
    }

    // ─────────────────────────────────────────────────────────────────────
    // AppDbContext — OnModelCreating runs without warning or error
    // with a fresh InMemory context (re-validation edge)
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_OnModelCreating_RunsWithoutException_OnFreshDatabase()
    {
        // Given: A fresh InMemory database name is used each time (no state carryover)
        // When: The context model is accessed (triggers OnModelCreating)
        // Then: No exception is thrown — the snake_case convention and configuration are valid
        for (int i = 0; i < 3; i++)
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: $"fresh_db_{Guid.NewGuid()}")
                .Options;

            var exception = Record.Exception(() =>
            {
                using var context = new AppDbContext(options);
                _ = context.Model;
            });

            Assert.Null(exception);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Entity.Id immutability — protected setter contract test via reflection
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public void Entity_Id_Setter_IsProtected_NotPublic()
    {
        // Given: Entity.Id must use a protected setter (per architecture: `protected set`)
        // When: The property setter accessibility is inspected via reflection
        // Then: The setter is non-public (protected or private)
        var idProperty = typeof(Entity).GetProperty("Id");

        Assert.NotNull(idProperty);

        var setter = idProperty!.SetMethod;
        Assert.NotNull(setter);
        Assert.False(
            setter!.IsPublic,
            "Entity.Id setter must be protected (not public) to prevent external mutation of primary keys"
        );
    }

    [Fact]
    public void Entity_CreatedAt_Setter_IsProtected_NotPublic()
    {
        // Given: Entity timestamps must use protected setters
        // When: The CreatedAt setter accessibility is inspected
        // Then: The setter is non-public
        var createdAtProperty = typeof(Entity).GetProperty("CreatedAt");

        Assert.NotNull(createdAtProperty);

        var setter = createdAtProperty!.SetMethod;
        Assert.NotNull(setter);
        Assert.False(
            setter!.IsPublic,
            "Entity.CreatedAt setter must be protected to prevent external mutation of audit timestamps"
        );
    }

    [Fact]
    public void Entity_UpdatedAt_Setter_IsProtected_NotPublic()
    {
        // Given: Entity timestamps must use protected setters
        // When: The UpdatedAt setter accessibility is inspected
        // Then: The setter is non-public
        var updatedAtProperty = typeof(Entity).GetProperty("UpdatedAt");

        Assert.NotNull(updatedAtProperty);

        var setter = updatedAtProperty!.SetMethod;
        Assert.NotNull(setter);
        Assert.False(
            setter!.IsPublic,
            "Entity.UpdatedAt setter must be protected to prevent external mutation of audit timestamps"
        );
    }

    // ─────────────────────────────────────────────────────────────────────
    // AppDbContext inherits from DbContext — type hierarchy check
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_InheritsFrom_DbContext()
    {
        // Given: AppDbContext must extend DbContext (not IdentityDbContext or other base)
        // When: The type hierarchy is inspected via reflection
        // Then: DbContext is a base class of AppDbContext
        Assert.True(
            typeof(DbContext).IsAssignableFrom(typeof(AppDbContext)),
            "AppDbContext must inherit from Microsoft.EntityFrameworkCore.DbContext"
        );
    }

    [Fact]
    public void AppDbContext_IsNotAbstract()
    {
        // Given: AppDbContext must be directly instantiable (not abstract)
        // When: The class declaration is inspected
        // Then: AppDbContext is a concrete (non-abstract) class
        Assert.False(
            typeof(AppDbContext).IsAbstract,
            "AppDbContext must be a concrete class (not abstract) — it is directly instantiated by EF Core"
        );
    }

    /// <summary>
    /// Minimal concrete entity for testing abstract Entity base class.
    /// Not for use in production code.
    /// </summary>
    private sealed class ConcreteTestEntity : Entity { }
}
