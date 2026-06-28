using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql.EntityFrameworkCore.PostgreSQL;
using SiesaAgents.Infrastructure.Data;
using System.Text.Json;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Expanded edge case and boundary tests for Story 1.3: Backend Database Foundation.
/// Covers scenarios not exercised by the base ATDD suite (AppDbContextTests.cs).
///
/// Focus areas:
/// - AppDbContext instantiation edge cases
/// - EF Core migration idempotency
/// - DI registration boundary conditions
/// - UseStatusCodePages RFC 7807 integration
/// - Concurrent request isolation
/// </summary>
public class AppDbContextEdgeCaseTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public AppDbContextEdgeCaseTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Migration idempotency
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P1] Migration idempotency boundary condition:
    /// GIVEN the migration has already been applied
    /// WHEN MigrateAsync is called a second time
    /// THEN no exception is thrown (EF Core migrations are idempotent)
    /// </summary>
    [Fact]
    public async Task AppDbContext_WhenMigrateCalledTwice_DoesNotThrow()
    {
        // GIVEN: AppDbContext resolved and first migration applied
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.MigrateAsync();

        // WHEN: MigrateAsync is called a second time
        var exception = await Record.ExceptionAsync(() => dbContext.Database.MigrateAsync());

        // THEN: No exception — migrations are idempotent
        Assert.Null(exception);
    }

    /// <summary>
    /// [P1] GetPendingMigrationsAsync boundary:
    /// GIVEN the migration has been applied
    /// WHEN GetPendingMigrationsAsync is called
    /// THEN the result is an empty collection (nothing pending)
    /// </summary>
    [Fact]
    public async Task AppDbContext_WhenMigrationApplied_PendingMigrationsIsEmpty()
    {
        // GIVEN: AppDbContext with migrations applied
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.MigrateAsync();

        // WHEN: Pending migrations are queried
        var pending = await dbContext.Database.GetPendingMigrationsAsync();

        // THEN: No pending migrations exist
        Assert.Empty(pending);
    }

    /// <summary>
    /// [P2] GetAppliedMigrationsAsync boundary:
    /// GIVEN the initial migration has been applied
    /// WHEN GetAppliedMigrationsAsync is called
    /// THEN at least one migration is recorded (InitialCreate)
    /// </summary>
    [Fact]
    public async Task AppDbContext_WhenMigrationApplied_AppliedMigrationsIsNonEmpty()
    {
        // GIVEN: AppDbContext with migrations applied
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.MigrateAsync();

        // WHEN: Applied migrations are queried
        var applied = await dbContext.Database.GetAppliedMigrationsAsync();

        // THEN: At least the InitialCreate migration was recorded
        Assert.NotEmpty(applied);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DI scope isolation
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P1] Scoped lifetime boundary:
    /// GIVEN AppDbContext is registered as Scoped
    /// WHEN two separate scopes resolve AppDbContext
    /// THEN they receive different instances (not shared state)
    /// </summary>
    [Fact]
    public void AppDbContext_WhenResolvedFromDifferentScopes_AreNotSameInstance()
    {
        // GIVEN: Two independent DI scopes
        using var scope1 = _factory.Services.CreateScope();
        using var scope2 = _factory.Services.CreateScope();

        // WHEN: Both scopes resolve AppDbContext
        var ctx1 = scope1.ServiceProvider.GetRequiredService<AppDbContext>();
        var ctx2 = scope2.ServiceProvider.GetRequiredService<AppDbContext>();

        // THEN: They are distinct instances (scoped lifetime per request)
        Assert.NotSame(ctx1, ctx2);
    }

    /// <summary>
    /// [P1] Same scope returns same instance boundary:
    /// GIVEN AppDbContext is registered as Scoped
    /// WHEN the same scope resolves AppDbContext twice
    /// THEN both resolutions return the same instance
    /// </summary>
    [Fact]
    public void AppDbContext_WhenResolvedTwiceFromSameScope_ReturnsSameInstance()
    {
        // GIVEN: A single DI scope
        using var scope = _factory.Services.CreateScope();

        // WHEN: AppDbContext is resolved twice from the same scope
        var ctx1 = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var ctx2 = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // THEN: The same instance is returned (scoped behavior)
        Assert.Same(ctx1, ctx2);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AppDbContext instantiation directly (unit-level, no DB)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P2] AppDbContext direct instantiation boundary:
    /// GIVEN DbContextOptions built with UseNpgsql and a dummy connection string
    /// WHEN AppDbContext is constructed directly (no connection opened)
    /// THEN no exception is thrown — construction is independent of DB availability
    /// </summary>
    [Fact]
    public void AppDbContext_WhenConstructedWithNpgsqlOptions_DoesNotThrow()
    {
        // GIVEN: Npgsql options with a dummy connection string (no DB opened at construction)
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=localhost;Database=dummy_test;Username=dummy;Password=dummy")
            .UseSnakeCaseNamingConvention()
            .Options;

        // WHEN: AppDbContext is directly instantiated
        var exception = Record.Exception(() =>
        {
            using var ctx = new AppDbContext(options);
        });

        // THEN: No exception — EF Core does not open the connection at construction time
        Assert.Null(exception);
    }

    /// <summary>
    /// [P2] AppDbContext OnModelCreating not crashing boundary:
    /// GIVEN AppDbContext resolved from DI (real Npgsql options)
    /// WHEN the model is accessed (which triggers OnModelCreating)
    /// THEN no exception is thrown
    /// </summary>
    [Fact]
    public void AppDbContext_WhenModelAccessed_OnModelCreatingDoesNotThrow()
    {
        // GIVEN: AppDbContext resolved from DI (real registered options)
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // WHEN: Model is accessed (forces OnModelCreating execution)
        var exception = Record.Exception(() =>
        {
            _ = dbContext.Model;
        });

        // THEN: OnModelCreating completes without exception
        Assert.Null(exception);
    }

    /// <summary>
    /// [P2] Updated in Story 2.1: ClienteEntity is now registered in the model (Epic 2 added it).
    /// GIVEN AppDbContext resolved from DI
    /// WHEN the model entity types are inspected
    /// THEN ClienteEntity is registered (Story 2.1) and Contacto entities are NOT (Epic 3 pending)
    /// </summary>
    [Fact]
    public void AppDbContext_WhenModelInspected_HasClienteEntityButNotContactoEntity()
    {
        // GIVEN: AppDbContext resolved from DI
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // WHEN: Model entity types are inspected
        var entityTypes = dbContext.Model.GetEntityTypes().ToList();
        var entityNames = entityTypes.Select(e => e.ClrType.Name).ToList();

        // THEN: ClienteEntity is registered (Story 2.1 adds it)
        Assert.Contains("ClienteEntity", entityNames);

        // AND: Contacto entities are NOT registered yet (Epic 3 pending)
        var contactoEntities = entityNames.Where(n => n.Contains("Contacto")).ToList();
        Assert.Empty(contactoEntities);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Connection string edge cases
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P2] Connection string contains expected username boundary (AC4):
    /// GIVEN AppDbContext is configured from appsettings.Development.json
    /// WHEN the connection string is inspected
    /// THEN it contains the expected username 'postgres'
    /// </summary>
    [Fact]
    public void AppDbContext_WhenConfigured_ConnectionStringContainsPostgresUser()
    {
        // GIVEN: AppDbContext resolved from DI
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // WHEN: The connection string is read
        var connectionString = dbContext.Database.GetConnectionString();

        // THEN: Connection string contains expected credentials
        Assert.NotNull(connectionString);
        Assert.True(connectionString!.Contains("postgres", StringComparison.OrdinalIgnoreCase),
            "Connection string must contain 'postgres' username per appsettings.Development.json");
    }

    /// <summary>
    /// [P2] Connection string does not expose password in logs boundary (defensive check):
    /// GIVEN AppDbContext is resolved from DI
    /// WHEN the connection string is retrieved
    /// THEN it is not null or empty
    /// </summary>
    [Fact]
    public void AppDbContext_WhenConfigured_ConnectionStringIsNotNullOrEmpty()
    {
        // GIVEN: AppDbContext resolved from DI
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // WHEN: Connection string is read
        var connectionString = dbContext.Database.GetConnectionString();

        // THEN: Connection string is set (AddDbContext wired it from configuration)
        Assert.False(string.IsNullOrWhiteSpace(connectionString),
            "ConnectionString must not be null or empty — AddDbContext must be wired to DefaultConnection");
    }
}

/// <summary>
/// Expanded edge case and boundary tests for UseStatusCodePages RFC 7807 responses.
/// Program.cs wires UseStatusCodePages to return Problem Details for 4xx status codes.
/// These are not covered by the ATDD suite which only tests 500.
/// </summary>
public class StatusCodePagesRfc7807Tests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public StatusCodePagesRfc7807Tests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 404 Not Found — UseStatusCodePages
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P1] 404 returns RFC 7807 boundary:
    /// GIVEN a request to a non-existent route
    /// WHEN the response is received
    /// THEN HTTP 404 is returned with application/problem+json content type
    /// </summary>
    [Fact]
    public async Task StatusCodePages_WhenRouteNotFound_Returns404WithProblemJson()
    {
        // GIVEN: A request to a route that does not exist
        // WHEN: The response is received
        var response = await _client.GetAsync("/api/v1/route-that-does-not-exist");

        // THEN: HTTP 404 with application/problem+json
        Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);
        var contentType = response.Content.Headers.ContentType?.MediaType;
        Assert.Equal("application/problem+json", contentType);
    }

    /// <summary>
    /// [P1] 404 response body contains status field boundary:
    /// GIVEN a request to a non-existent route
    /// WHEN the response body is parsed
    /// THEN the JSON contains 'status': 404
    /// </summary>
    [Fact]
    public async Task StatusCodePages_WhenRouteNotFound_ResponseContainsStatus404()
    {
        // GIVEN: Request to non-existent route
        var response = await _client.GetAsync("/api/v1/nonexistent");
        var body = await response.Content.ReadAsStringAsync();

        // WHEN: Body is parsed as JSON
        var doc = JsonDocument.Parse(body);

        // THEN: Status field is 404
        Assert.True(doc.RootElement.TryGetProperty("status", out var statusProp),
            "Response must contain 'status' field per RFC 7807");
        Assert.Equal(404, statusProp.GetInt32());
    }

    /// <summary>
    /// [P1] 404 response body contains title boundary:
    /// GIVEN a request to a non-existent route
    /// WHEN the response body is parsed
    /// THEN the JSON contains a non-empty 'title' field
    /// </summary>
    [Fact]
    public async Task StatusCodePages_WhenRouteNotFound_ResponseContainsNonEmptyTitle()
    {
        // GIVEN: Request to non-existent route
        var response = await _client.GetAsync("/api/v1/nonexistent");
        var body = await response.Content.ReadAsStringAsync();

        // WHEN: Body is parsed as JSON
        var doc = JsonDocument.Parse(body);

        // THEN: Title field is present and non-empty
        Assert.True(doc.RootElement.TryGetProperty("title", out var titleProp),
            "Response must contain 'title' field per RFC 7807");
        Assert.Equal(JsonValueKind.String, titleProp.ValueKind);
        Assert.NotEmpty(titleProp.GetString()!);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Security: no internal details in 4xx responses
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P0] No stack trace in 404 response (NFR6 boundary):
    /// GIVEN a request to a non-existent route
    /// WHEN the response body is inspected
    /// THEN no stack trace or internal detail is exposed
    /// </summary>
    [Fact]
    public async Task StatusCodePages_WhenRouteNotFound_NoStackTraceExposed()
    {
        // GIVEN: Request to non-existent route
        var response = await _client.GetAsync("/api/v1/nonexistent");
        var body = await response.Content.ReadAsStringAsync();

        // THEN: No internal details exposed
        Assert.False(body.Contains("stackTrace"), "No stackTrace in 404 response (NFR6)");
        Assert.False(body.Contains("StackTrace"), "No StackTrace in 404 response (NFR6)");
        Assert.False(body.Contains("\"exception\""), "No exception field in 404 response (NFR6)");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Concurrent request isolation boundary
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P2] Concurrent error requests return consistent RFC 7807 responses:
    /// GIVEN multiple concurrent requests to an error endpoint
    /// WHEN responses are collected
    /// THEN all return HTTP 500 with application/problem+json (no interference between requests)
    /// </summary>
    [Fact]
    public async Task ExceptionMiddleware_WhenConcurrentErrorRequests_AllReturn500ProblemJson()
    {
        // GIVEN: Factory with throwing endpoint (disposed after test)
        await using var throwingFactory = new ThrowingEndpointApplicationFactory();
        var client1 = throwingFactory.CreateClient();
        var client2 = throwingFactory.CreateClient();
        var client3 = throwingFactory.CreateClient();

        // WHEN: Multiple concurrent error requests
        var tasks = new[]
        {
            client1.GetAsync("/api/v1/test-error"),
            client2.GetAsync("/api/v1/test-error"),
            client3.GetAsync("/api/v1/test-error")
        };

        var responses = await Task.WhenAll(tasks);

        // THEN: All return 500 with proper content type (no cross-request contamination)
        foreach (var response in responses)
        {
            Assert.Equal(System.Net.HttpStatusCode.InternalServerError, response.StatusCode);
            var contentType = response.Content.Headers.ContentType?.MediaType;
            Assert.Equal("application/problem+json", contentType);
        }
    }
}
