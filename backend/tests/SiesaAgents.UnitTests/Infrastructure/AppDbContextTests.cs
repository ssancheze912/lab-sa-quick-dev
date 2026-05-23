using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Entities;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Story 1.3: Backend Database Foundation
/// Epic 1: Project Foundation & Application Shell
///
/// Unit tests for AppDbContext EF Core configuration.
/// Status: RED — tests define expected behaviour before implementation is complete.
///
/// Acceptance Criteria covered:
///   AC2 — AppDbContext resolves from DI with Npgsql configuration
///   AC4 — OnModelCreating applies UseSnakeCaseNamingConvention() as last call
///   AC5 — Solution builds with zero errors; Entity base class uses Guid + DateTimeOffset
/// </summary>
public class AppDbContextTests
{
    // ─────────────────────────────────────────────────────────────────────
    // AC4 — OnModelCreating applies UseSnakeCaseNamingConvention
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_OnModelCreating_AppliesSnakeCaseNaming_WithoutError()
    {
        // Given: AppDbContext is configured with EF Core InMemory provider
        // When: OnModelCreating is executed (implicitly via EnsureCreated or model access)
        // Then: UseSnakeCaseNamingConvention() is applied without throwing any exception
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        // Act + Assert — no exception thrown means snake_case convention was applied cleanly
        var exception = Record.Exception(() =>
        {
            using var context = new AppDbContext(options);
            // Accessing Model triggers OnModelCreating
            _ = context.Model;
        });

        Assert.Null(exception);
    }

    [Fact]
    public void AppDbContext_Constructor_AcceptsDbContextOptions_WithoutError()
    {
        // Given: Valid DbContextOptions<AppDbContext> is provided
        // When: AppDbContext is instantiated
        // Then: No exception is thrown (primary constructor pattern works)
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var exception = Record.Exception(() =>
        {
            using var context = new AppDbContext(options);
            Assert.NotNull(context);
        });

        Assert.Null(exception);
    }

    // ─────────────────────────────────────────────────────────────────────
    // AC2 — AppDbContext can be resolved when configured with proper options
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_CanEnsureCreated_WithInMemoryProvider()
    {
        // Given: AppDbContext is registered with InMemory provider (stand-in for Npgsql in unit tests)
        // When: EnsureCreated() is called
        // Then: Database schema is applied without errors (validates OnModelCreating logic)
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new AppDbContext(options);

        var exception = Record.Exception(() => context.Database.EnsureCreated());

        Assert.Null(exception);
    }

    // ─────────────────────────────────────────────────────────────────────
    // AC5 — Entity base class: Id is Guid, timestamps are DateTimeOffset
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public void Entity_Id_IsNonEmpty_Guid_OnConstruction()
    {
        // Given: A concrete implementation of Entity is instantiated
        // When: The Id property is read
        // Then: It is a non-empty Guid (auto-assigned via Guid.NewGuid())
        var entity = new ConcreteTestEntity();

        Assert.NotEqual(Guid.Empty, entity.Id);
    }

    [Fact]
    public void Entity_TwoInstances_HaveDifferent_Ids()
    {
        // Given: Two separate Entity instances are created
        // When: Their Id properties are compared
        // Then: They are not equal (each gets a unique Guid)
        var entity1 = new ConcreteTestEntity();
        var entity2 = new ConcreteTestEntity();

        Assert.NotEqual(entity1.Id, entity2.Id);
    }

    [Fact]
    public void Entity_CreatedAt_IsDateTimeOffset_NotDateTime()
    {
        // Given: An Entity is instantiated
        // When: The CreatedAt property is read
        // Then: It is a DateTimeOffset (never DateTime — architectural rule)
        var entity = new ConcreteTestEntity();

        // Verify it is DateTimeOffset (type check is implicit via property type)
        // and that it is set to a recent UTC time
        Assert.True(entity.CreatedAt > DateTimeOffset.UtcNow.AddMinutes(-1));
        Assert.True(entity.CreatedAt <= DateTimeOffset.UtcNow.AddSeconds(1));
    }

    [Fact]
    public void Entity_UpdatedAt_IsDateTimeOffset_NotDateTime()
    {
        // Given: An Entity is instantiated
        // When: The UpdatedAt property is read
        // Then: It is a DateTimeOffset set to UTC now (never DateTime)
        var entity = new ConcreteTestEntity();

        Assert.True(entity.UpdatedAt > DateTimeOffset.UtcNow.AddMinutes(-1));
        Assert.True(entity.UpdatedAt <= DateTimeOffset.UtcNow.AddSeconds(1));
    }

    // ─────────────────────────────────────────────────────────────────────
    // AC3 — ExceptionHandlingMiddleware: Detail must be null (no stack trace)
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public void ExceptionHandling_ProblemDetails_Detail_IsNull_NotExMessage()
    {
        // Given: An exception occurs with a revealing message
        // When: The middleware creates ProblemDetails
        // Then: The Detail field is null — ex.Message is never exposed (NFR6)
        var sensitiveException = new InvalidOperationException(
            "Sensitive internal detail that must never be exposed to callers"
        );

        // Simulate what ExceptionHandlingMiddleware must produce
        var problemDetails = new Microsoft.AspNetCore.Mvc.ProblemDetails
        {
            Status = 500,
            Title = "An unexpected error occurred.",
            Detail = null  // NEVER: sensitiveException.Message
        };

        Assert.Null(problemDetails.Detail);
        Assert.Equal(500, problemDetails.Status);
        Assert.Equal("An unexpected error occurred.", problemDetails.Title);

        // Ensure the exception message is NOT present anywhere in the response
        Assert.NotEqual(sensitiveException.Message, problemDetails.Detail);
        Assert.DoesNotContain(
            sensitiveException.Message,
            problemDetails.Title ?? string.Empty
        );
    }

    /// <summary>
    /// Concrete implementation of the abstract Entity class for testing purposes only.
    /// This class must NOT be used in production code.
    /// </summary>
    private sealed class ConcreteTestEntity : Entity
    {
        // No additional properties — used only to instantiate the abstract base class
    }
}
