using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using SiesaAgents.Infrastructure.Data;
using Testcontainers.PostgreSql;
using Xunit;

// STORY 1.3 — Backend Database Foundation — Edge Case Expansion
// These tests EXPAND the ATDD coverage with edge cases, boundary conditions, and negative paths.
// Original ATDD tests are in AppDbContextTests.cs.
// BMad TEA testarch-automate: BMad-Integrated Mode

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Edge case tests for AppDbContext, ExceptionHandlingMiddleware, and DI registration.
/// Covers boundary conditions not tested in the ATDD baseline.
/// </summary>
public class AppDbContextEdgeCaseTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithDatabase("siesa_agents_edge_test")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .Build();

    public async Task InitializeAsync() => await _postgres.StartAsync();

    public async Task DisposeAsync() => await _postgres.DisposeAsync();

    // -------------------------------------------------------------------------
    // BOUNDARY: Migration idempotency — running MigrateAsync twice must not fail
    // -------------------------------------------------------------------------

    /// <summary>
    /// GIVEN: EF Core migrations have already been applied once
    /// WHEN:  MigrateAsync is called a second time on the same database
    /// THEN:  No exception is thrown (idempotent migration)
    /// </summary>
    [Fact]
    public async Task GivenMigrationAlreadyApplied_WhenMigratedAgain_ThenNoExceptionThrown()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;

        await using var contextFirst = new AppDbContext(options);
        await contextFirst.Database.MigrateAsync();

        // Act — second migration on an already-migrated database
        await using var contextSecond = new AppDbContext(options);
        var ex = await Record.ExceptionAsync(() => contextSecond.Database.MigrateAsync());

        // Assert — must be idempotent, no exception
        Assert.Null(ex);
    }

    // -------------------------------------------------------------------------
    // BOUNDARY: No extra tables created after InitialCreate migration
    // ATDD only checks clientes and contactos. This verifies NO unexpected tables
    // (other than __ef_migrations_history) were created.
    // -------------------------------------------------------------------------

    /// <summary>
    /// GIVEN: InitialCreate migration applied (empty Up())
    /// WHEN:  All public tables in the schema are enumerated
    /// THEN:  Only __ef_migrations_history exists — zero domain tables
    /// </summary>
    [Fact]
    public async Task GivenInitialMigration_WhenAllTablesEnumerated_ThenOnlyMigrationsHistoryExists()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;

        await using var context = new AppDbContext(options);
        await context.Database.MigrateAsync();

        // Act
        await using var conn = new NpgsqlConnection(_postgres.GetConnectionString());
        await conn.OpenAsync();

        await using var cmd = conn.CreateCommand();
        cmd.CommandText = """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
            """;

        await using var reader = await cmd.ExecuteReaderAsync();
        var tables = new List<string>();
        while (await reader.ReadAsync())
            tables.Add(reader.GetString(0));

        // Assert — the ONLY table must be __ef_migrations_history
        Assert.Single(tables);
        Assert.Equal("__ef_migrations_history", tables[0]);
    }

    // -------------------------------------------------------------------------
    // EDGE CASE: InitialCreate migration row recorded in __ef_migrations_history
    // -------------------------------------------------------------------------

    /// <summary>
    /// GIVEN: InitialCreate migration applied
    /// WHEN:  __ef_migrations_history is queried for row count
    /// THEN:  Exactly one migration row exists (InitialCreate)
    /// </summary>
    [Fact]
    public async Task GivenInitialMigration_WhenHistoryQueried_ThenExactlyOneMigrationRowExists()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;

        await using var context = new AppDbContext(options);
        await context.Database.MigrateAsync();

        // Act
        await using var conn = new NpgsqlConnection(_postgres.GetConnectionString());
        await conn.OpenAsync();

        await using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT COUNT(*) FROM __ef_migrations_history";
        var count = (long)(await cmd.ExecuteScalarAsync() ?? 0L);

        // Assert
        Assert.Equal(1L, count);
    }

    // -------------------------------------------------------------------------
    // BOUNDARY: AppDbContext created with InMemory provider (no PostgreSQL)
    // Must not throw — proves constructor is provider-agnostic
    // -------------------------------------------------------------------------

    /// <summary>
    /// GIVEN: DbContextOptions configured with InMemory provider (not Npgsql)
    /// WHEN:  AppDbContext is instantiated
    /// THEN:  No exception is thrown — constructor is provider-agnostic
    /// </summary>
    [Fact]
    public void GivenInMemoryOptions_WhenAppDbContextCreated_ThenNoExceptionThrown()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("edge-inmemory-db")
            .Options;

        // Act & Assert
        using var context = new AppDbContext(options);
        Assert.NotNull(context);
    }

    // -------------------------------------------------------------------------
    // EDGE CASE: AppDbContext has zero DbSet properties (scope boundary Story 1.3)
    // Verifies no entity types are registered in the model in this story
    // -------------------------------------------------------------------------

    /// <summary>
    /// GIVEN: AppDbContext is configured per Story 1.3 (no domain entities)
    /// WHEN:  Model entity types are enumerated
    /// THEN:  Zero entity types exist — no DbSet properties defined
    /// </summary>
    [Fact]
    public void GivenAppDbContext_WhenEntityTypesEnumerated_ThenZeroEntityTypesExist()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("entity-types-db")
            .Options;

        // Act
        using var context = new AppDbContext(options);
        var entityTypes = context.Model.GetEntityTypes().ToList();

        // Assert — no domain entities in Story 1.3
        Assert.Empty(entityTypes);
    }

    // -------------------------------------------------------------------------
    // BOUNDARY: DI resolves AppDbContext as Scoped (not Singleton)
    // Each scope must get a different instance
    // -------------------------------------------------------------------------

    /// <summary>
    /// GIVEN: AppDbContext is registered via AddDbContext (scoped lifetime)
    /// WHEN:  Two separate DI scopes each resolve AppDbContext
    /// THEN:  The two instances are NOT the same object reference
    /// </summary>
    [Fact]
    public void GivenDiRegistration_WhenTwoScopesResolveContext_ThenInstancesAreDifferent()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(opts =>
            opts.UseInMemoryDatabase("scoped-db"));

        using var provider = services.BuildServiceProvider();

        // Act
        using var scope1 = provider.CreateScope();
        using var scope2 = provider.CreateScope();

        var ctx1 = scope1.ServiceProvider.GetRequiredService<AppDbContext>();
        var ctx2 = scope2.ServiceProvider.GetRequiredService<AppDbContext>();

        // Assert — scoped lifetime: different instances per scope
        Assert.NotSame(ctx1, ctx2);
    }

    // -------------------------------------------------------------------------
    // BOUNDARY: DI resolves same AppDbContext instance within single scope
    // -------------------------------------------------------------------------

    /// <summary>
    /// GIVEN: AppDbContext is registered via AddDbContext (scoped lifetime)
    /// WHEN:  The same DI scope resolves AppDbContext twice
    /// THEN:  Both resolutions return the same instance (scoped == once per scope)
    /// </summary>
    [Fact]
    public void GivenDiRegistration_WhenSameScopeResolvesContextTwice_ThenSameInstanceReturned()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(opts =>
            opts.UseInMemoryDatabase("scoped-same-db"));

        using var provider = services.BuildServiceProvider();
        using var scope = provider.CreateScope();

        // Act
        var ctx1 = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var ctx2 = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // Assert — same scope = same instance
        Assert.Same(ctx1, ctx2);
    }

    // -------------------------------------------------------------------------
    // EDGE CASE: ApplyConfigurationsFromAssembly with empty Configurations/ directory
    // Must not throw — the Configurations/ directory is empty in Story 1.3
    // -------------------------------------------------------------------------

    /// <summary>
    /// GIVEN: AppDbContext with empty Configurations/ directory (no IEntityTypeConfiguration classes)
    /// WHEN:  OnModelCreating calls ApplyConfigurationsFromAssembly
    /// THEN:  No exception is thrown — empty assembly scan is valid
    /// </summary>
    [Fact]
    public void GivenEmptyConfigurationsDirectory_WhenModelCreated_ThenNoExceptionThrown()
    {
        // Arrange — InMemory provider triggers OnModelCreating without needing PostgreSQL
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("empty-config-db")
            .Options;

        // Act & Assert
        using var context = new AppDbContext(options);
        var ex = Record.Exception(() => _ = context.Model);

        Assert.Null(ex);
    }
}

/// <summary>
/// Edge case tests for ExceptionHandlingMiddleware — negative paths and boundary conditions.
/// Separate class from AppDbContextEdgeCaseTests to avoid PostgreSQL container dependency.
/// </summary>
public class ExceptionHandlingMiddlewareEdgeCaseTests
{
    // -------------------------------------------------------------------------
    // EDGE CASE: title field exact value in Problem Details response
    // ATDD only checks presence — this verifies the exact expected value
    // -------------------------------------------------------------------------

    /// <summary>
    /// GIVEN: An unhandled exception occurs
    /// WHEN:  Problem Details body is returned
    /// THEN:  title field equals exactly "An unexpected error occurred."
    /// </summary>
    [Fact]
    public async Task GivenUnhandledException_WhenProblemDetailsTitleInspected_ThenExactExpectedValue()
    {
        // Arrange
        await using var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(host =>
            {
                host.ConfigureServices(services =>
                {
                    var descriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                    if (descriptor is not null)
                        services.Remove(descriptor);
                    services.AddDbContext<AppDbContext>(opts =>
                        opts.UseInMemoryDatabase("title-check-db"));
                });
            });

        using var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/v1/test-error");

        // Assert
        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);
        var title = json.RootElement.GetProperty("title").GetString();
        Assert.Equal("An unexpected error occurred.", title);
    }

    // -------------------------------------------------------------------------
    // EDGE CASE: detail field is explicitly null (not absent, not empty string)
    // -------------------------------------------------------------------------

    /// <summary>
    /// GIVEN: An unhandled exception occurs
    /// WHEN:  detail field in Problem Details is inspected
    /// THEN:  detail is JSON null (not missing, not empty string — NFR6)
    /// </summary>
    [Fact]
    public async Task GivenUnhandledException_WhenDetailFieldInspected_ThenDetailIsJsonNull()
    {
        // Arrange
        await using var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(host =>
            {
                host.ConfigureServices(services =>
                {
                    var descriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                    if (descriptor is not null)
                        services.Remove(descriptor);
                    services.AddDbContext<AppDbContext>(opts =>
                        opts.UseInMemoryDatabase("detail-null-db"));
                });
            });

        using var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);

        // Assert — detail MUST be present and be JSON null (not absent)
        Assert.True(json.RootElement.TryGetProperty("detail", out var detail),
            "detail field must be present in Problem Details");
        Assert.Equal(JsonValueKind.Null, detail.ValueKind);
    }

    // -------------------------------------------------------------------------
    // EDGE CASE: status field in body matches HTTP status code (500)
    // -------------------------------------------------------------------------

    /// <summary>
    /// GIVEN: An unhandled exception occurs
    /// WHEN:  status field in the Problem Details body is inspected
    /// THEN:  status equals 500 (matches HTTP status code)
    /// </summary>
    [Fact]
    public async Task GivenUnhandledException_WhenStatusFieldInspected_ThenEquals500()
    {
        // Arrange
        await using var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(host =>
            {
                host.ConfigureServices(services =>
                {
                    var descriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                    if (descriptor is not null)
                        services.Remove(descriptor);
                    services.AddDbContext<AppDbContext>(opts =>
                        opts.UseInMemoryDatabase("status-check-db"));
                });
            });

        using var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/v1/test-error");

        // Assert — HTTP status
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);

        // Assert — body status field
        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);
        var statusField = json.RootElement.GetProperty("status").GetInt32();
        Assert.Equal(500, statusField);
    }

    // -------------------------------------------------------------------------
    // NEGATIVE PATH: innerException must NOT be in the response body
    // -------------------------------------------------------------------------

    /// <summary>
    /// GIVEN: An unhandled exception occurs
    /// WHEN:  The Problem Details body is inspected for dangerous fields
    /// THEN:  innerException, traceId from exception source, and exceptionMessage are absent
    /// </summary>
    [Fact]
    public async Task GivenUnhandledException_WhenResponseBodyInspected_ThenNoDangerousExceptionFieldsExposed()
    {
        // Arrange
        await using var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(host =>
            {
                host.ConfigureServices(services =>
                {
                    var descriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                    if (descriptor is not null)
                        services.Remove(descriptor);
                    services.AddDbContext<AppDbContext>(opts =>
                        opts.UseInMemoryDatabase("dangerous-fields-db"));
                });
            });

        using var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);
        var root = json.RootElement;

        // Assert — dangerous fields MUST be absent (NFR6)
        Assert.False(root.TryGetProperty("stackTrace", out _), "stackTrace must NOT be exposed");
        Assert.False(root.TryGetProperty("exception", out _), "exception must NOT be exposed");
        Assert.False(root.TryGetProperty("innerException", out _), "innerException must NOT be exposed");
        Assert.False(root.TryGetProperty("exceptionMessage", out _), "exceptionMessage must NOT be exposed");
        Assert.False(root.TryGetProperty("errors", out _), "raw errors collection must NOT be exposed for 500s");
    }

    // -------------------------------------------------------------------------
    // EDGE CASE: middleware does not interfere with normal (non-error) routes
    // A valid route must still return 200 when no exception is thrown
    // -------------------------------------------------------------------------

    /// <summary>
    /// GIVEN: ExceptionHandlingMiddleware is registered
    /// WHEN:  A request hits a normal route (no exception thrown)
    /// THEN:  Response is NOT 500 — middleware is transparent for non-error paths
    /// </summary>
    [Fact]
    public async Task GivenMiddlewareRegistered_WhenNormalRouteRequested_ThenMiddlewareIsTransparent()
    {
        // Arrange
        await using var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(host =>
            {
                host.ConfigureServices(services =>
                {
                    var descriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                    if (descriptor is not null)
                        services.Remove(descriptor);
                    services.AddDbContext<AppDbContext>(opts =>
                        opts.UseInMemoryDatabase("normal-route-db"));
                });
            });

        using var client = factory.CreateClient();

        // Act — hitting the OpenAPI spec endpoint (scalar), which does not throw
        var response = await client.GetAsync("/openapi/v1.json");

        // Assert — middleware must NOT intercept non-error responses
        Assert.NotEqual(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    // -------------------------------------------------------------------------
    // BOUNDARY: Content-Type header for problem+json response
    // Validates the media type exactly (not charset or other parameters)
    // -------------------------------------------------------------------------

    /// <summary>
    /// GIVEN: An unhandled exception occurs
    /// WHEN:  Content-Type header of the response is inspected
    /// THEN:  MediaType is exactly application/problem+json
    /// </summary>
    [Fact]
    public async Task GivenUnhandledException_WhenContentTypeHeaderInspected_ThenMediaTypeIsApplicationProblemJson()
    {
        // Arrange
        await using var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(host =>
            {
                host.ConfigureServices(services =>
                {
                    var descriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                    if (descriptor is not null)
                        services.Remove(descriptor);
                    services.AddDbContext<AppDbContext>(opts =>
                        opts.UseInMemoryDatabase("content-type-db"));
                });
            });

        using var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/v1/test-error");

        // Assert — media type must match exactly
        var mediaType = response.Content.Headers.ContentType?.MediaType;
        Assert.Equal("application/problem+json", mediaType);
    }

    // -------------------------------------------------------------------------
    // EDGE CASE: Problem Details body is valid JSON (parseable)
    // -------------------------------------------------------------------------

    /// <summary>
    /// GIVEN: An unhandled exception occurs
    /// WHEN:  Response body is parsed as JSON
    /// THEN:  Body is well-formed JSON (no parse exception)
    /// </summary>
    [Fact]
    public async Task GivenUnhandledException_WhenBodyParsedAsJson_ThenBodyIsWellFormedJson()
    {
        // Arrange
        await using var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(host =>
            {
                host.ConfigureServices(services =>
                {
                    var descriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                    if (descriptor is not null)
                        services.Remove(descriptor);
                    services.AddDbContext<AppDbContext>(opts =>
                        opts.UseInMemoryDatabase("json-wellformed-db"));
                });
            });

        using var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();

        // Assert — must parse without JsonException
        var ex = Record.Exception(() => JsonDocument.Parse(body));
        Assert.Null(ex);
    }
}

/// <summary>
/// Edge case tests for AppDbContext DI and Npgsql provider validation.
/// Uses Testcontainers to verify real provider registration.
/// </summary>
public class AppDbContextDiEdgeCaseTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithDatabase("siesa_agents_di_edge")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .Build();

    public async Task InitializeAsync() => await _postgres.StartAsync();

    public async Task DisposeAsync() => await _postgres.DisposeAsync();

    // -------------------------------------------------------------------------
    // EDGE CASE: Npgsql provider name is exactly the expected string
    // ATDD checks DI resolves — this verifies the exact provider name
    // -------------------------------------------------------------------------

    /// <summary>
    /// GIVEN: AppDbContext registered with UseNpgsql
    /// WHEN:  ProviderName is retrieved from the resolved DbContext
    /// THEN:  ProviderName equals exactly "Npgsql.EntityFrameworkCore.PostgreSQL"
    /// </summary>
    [Fact]
    public async Task GivenNpgsqlRegistered_WhenProviderNameInspected_ThenExactProviderNameReturned()
    {
        // Arrange
        await using var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(host =>
            {
                host.UseSetting(
                    "ConnectionStrings:DefaultConnection",
                    _postgres.GetConnectionString());
            });

        using var scope = factory.Services.CreateScope();

        // Act
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var providerName = dbContext.Database.ProviderName;

        // Assert
        Assert.Equal("Npgsql.EntityFrameworkCore.PostgreSQL", providerName);
    }

    // -------------------------------------------------------------------------
    // EDGE CASE: CanConnectAsync succeeds with test container connection string
    // -------------------------------------------------------------------------

    /// <summary>
    /// GIVEN: AppDbContext configured with valid PostgreSQL connection string
    /// WHEN:  CanConnectAsync is called
    /// THEN:  Returns true — database is reachable
    /// </summary>
    [Fact]
    public async Task GivenValidConnectionString_WhenCanConnectAsync_ThenReturnsTrue()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;

        await using var context = new AppDbContext(options);

        // Act
        var canConnect = await context.Database.CanConnectAsync();

        // Assert
        Assert.True(canConnect);
    }

    // -------------------------------------------------------------------------
    // NEGATIVE PATH: Invalid connection string — CanConnectAsync returns false
    // -------------------------------------------------------------------------

    /// <summary>
    /// GIVEN: AppDbContext configured with a clearly invalid connection string
    /// WHEN:  CanConnectAsync is called with a short timeout
    /// THEN:  Returns false or throws — database is not reachable
    /// </summary>
    [Fact]
    public async Task GivenInvalidConnectionString_WhenCanConnectAsync_ThenReturnsFalse()
    {
        // Arrange — port 9 (discard protocol) is a safe, unreachable port for testing
        var badConnString = "Host=127.0.0.1;Port=9;Database=nonexistent;Username=nobody;Password=wrong;Timeout=2;Command Timeout=2";
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(badConnString)
            .Options;

        await using var context = new AppDbContext(options);

        // Act — expect false or NpgsqlException; either is correct behavior
        bool canConnect;
        try
        {
            canConnect = await context.Database.CanConnectAsync();
        }
        catch (Exception ex) when (ex is NpgsqlException || ex is OperationCanceledException || ex is TimeoutException)
        {
            // Exception is acceptable — connection failed as expected
            canConnect = false;
        }

        // Assert — must not successfully connect to an invalid host
        Assert.False(canConnect);
    }

    // -------------------------------------------------------------------------
    // BOUNDARY: GetPendingMigrationsAsync returns empty after all applied
    // -------------------------------------------------------------------------

    /// <summary>
    /// GIVEN: All migrations have been applied
    /// WHEN:  GetPendingMigrationsAsync is called
    /// THEN:  Returns empty collection — no pending migrations
    /// </summary>
    [Fact]
    public async Task GivenAllMigrationsApplied_WhenPendingMigrationsQueried_ThenEmpty()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;

        await using var context = new AppDbContext(options);
        await context.Database.MigrateAsync();

        // Act
        var pending = await context.Database.GetPendingMigrationsAsync();

        // Assert
        Assert.Empty(pending);
    }

    // -------------------------------------------------------------------------
    // BOUNDARY: GetAppliedMigrationsAsync returns exactly InitialCreate after migration
    // -------------------------------------------------------------------------

    /// <summary>
    /// GIVEN: InitialCreate migration applied
    /// WHEN:  GetAppliedMigrationsAsync is called
    /// THEN:  Exactly one migration is returned and its name contains "InitialCreate"
    /// </summary>
    [Fact]
    public async Task GivenInitialMigrationApplied_WhenAppliedMigrationsQueried_ThenContainsInitialCreate()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;

        await using var context = new AppDbContext(options);
        await context.Database.MigrateAsync();

        // Act
        var applied = (await context.Database.GetAppliedMigrationsAsync()).ToList();

        // Assert
        Assert.Single(applied);
        Assert.Contains("InitialCreate", applied[0]);
    }
}
