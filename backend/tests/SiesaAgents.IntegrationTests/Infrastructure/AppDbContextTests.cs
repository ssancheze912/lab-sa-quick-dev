using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using Testcontainers.PostgreSql;
using Xunit;

// STORY 1.3 — Backend Database Foundation
// AC Coverage:
//   AC1 - siesa_agents_db created, __ef_migrations_history exists (TC-E1-P1-05)
//   AC2 - No domain tables (clientes, contactos) after InitialCreate migration (TC-E1-P1-05)
//   AC3 - ExceptionHandlingMiddleware → Problem Details RFC 7807, no stackTrace (TC-E1-P0-05)
//   AC4 - ApplySnakeCaseNaming() → __ef_migrations_history columns are snake_case (TC-E1-P2-04)
//   AC5 - All four Clean Architecture projects compile and build with zero errors (build test)
//   AC6 - AppDbContext resolves from DI container without error using Npgsql provider

namespace SiesaAgents.IntegrationTests.Infrastructure;

/// <summary>
/// Integration tests for Story 1.3: Backend Database Foundation.
/// Tests are in RED phase — they define expected behavior before full implementation.
/// Uses TestContainers for isolated PostgreSQL instance.
/// Framework: xUnit + WebApplicationFactory + Testcontainers.PostgreSql
/// </summary>
public class AppDbContextTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithDatabase("siesa_agents_db")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .Build();

    public async Task InitializeAsync()
    {
        // GIVEN: A clean PostgreSQL container starts before each test class
        await _postgres.StartAsync();
    }

    public async Task DisposeAsync()
    {
        await _postgres.DisposeAsync();
    }

    private WebApplicationFactory<Program> CreateFactory()
    {
        return new WebApplicationFactory<Program>()
            .WithWebHostBuilder(host =>
            {
                host.UseSetting(
                    "ConnectionStrings:DefaultConnection",
                    _postgres.GetConnectionString());
            });
    }

    // -------------------------------------------------------------------------
    // TC-E1-P1-05 (P1): EF Core Migration Creates Database and Migrations Table
    // AC1 + AC2 — siesa_agents_db created, __ef_migrations_history exists, no domain tables
    // -------------------------------------------------------------------------

    /// <summary>
    /// GIVEN: PostgreSQL is running via TestContainers
    /// WHEN:  AppDbContext applies pending migrations (InitialCreate)
    /// THEN:  The __ef_migrations_history table exists in the database
    /// RED:   Fails because AppDbContext and migrations do not exist yet
    /// </summary>
    [Fact]
    public async Task GivenPostgreSqlRunning_WhenMigrationsApplied_ThenEfMigrationsHistoryTableExists()
    {
        // GIVEN: A WebApplicationFactory with the test database connection
        await using var factory = CreateFactory();
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<SiesaAgents.Infrastructure.Data.AppDbContext>();

        // WHEN: Applying EF Core migrations (InitialCreate — empty migration)
        await dbContext.Database.MigrateAsync();

        // THEN: The __ef_migrations_history table must exist
        await using var connection = new NpgsqlConnection(_postgres.GetConnectionString());
        await connection.OpenAsync();

        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = '__ef_migrations_history'
            """;

        var result = await command.ExecuteScalarAsync();
        Assert.Equal(1L, result);
    }

    /// <summary>
    /// GIVEN: EF Core InitialCreate migration has been applied
    /// WHEN:  Developer inspects the database schema
    /// THEN:  NO domain tables exist — clientes and contactos must be absent
    /// RED:   Fails if clientes or contactos tables are created (scope boundary violation)
    /// </summary>
    [Fact]
    public async Task GivenInitialMigrationApplied_WhenSchemaInspected_ThenNoDomainTablesExist()
    {
        // GIVEN: A WebApplicationFactory with the test database connection
        await using var factory = CreateFactory();
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<SiesaAgents.Infrastructure.Data.AppDbContext>();

        // WHEN: Applying EF Core migrations
        await dbContext.Database.MigrateAsync();

        // THEN: clientes table must NOT exist
        await using var connection = new NpgsqlConnection(_postgres.GetConnectionString());
        await connection.OpenAsync();

        await using var clientesCmd = connection.CreateCommand();
        clientesCmd.CommandText = """
            SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = 'clientes'
            """;
        var clientesCount = await clientesCmd.ExecuteScalarAsync();
        Assert.Equal(0L, clientesCount);

        // THEN: contactos table must NOT exist
        await using var contactosCmd = connection.CreateCommand();
        contactosCmd.CommandText = """
            SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = 'contactos'
            """;
        var contactosCount = await contactosCmd.ExecuteScalarAsync();
        Assert.Equal(0L, contactosCount);
    }

    // -------------------------------------------------------------------------
    // TC-E1-P2-04 (P2): snake_case Column Naming Applied via ApplySnakeCaseNaming
    // AC4 — __ef_migrations_history columns use snake_case (migration_id, product_version)
    // -------------------------------------------------------------------------

    /// <summary>
    /// GIVEN: EF Core migration applied with ApplySnakeCaseNaming() active
    /// WHEN:  Developer inspects __ef_migrations_history columns
    /// THEN:  Columns are snake_case: migration_id, product_version (NOT MigrationId)
    /// RED:   Fails because AppDbContext.OnModelCreating with ApplySnakeCaseNaming() not implemented
    /// </summary>
    [Fact]
    public async Task GivenSnakeCaseNamingEnabled_WhenMigrationApplied_ThenMigrationsHistoryColumnsAreSnakeCase()
    {
        // GIVEN: A WebApplicationFactory with the test database connection
        await using var factory = CreateFactory();
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<SiesaAgents.Infrastructure.Data.AppDbContext>();

        // WHEN: Applying EF Core migrations (ApplySnakeCaseNaming() must be last in OnModelCreating)
        await dbContext.Database.MigrateAsync();

        // THEN: migration_id column must exist (snake_case)
        await using var connection = new NpgsqlConnection(_postgres.GetConnectionString());
        await connection.OpenAsync();

        await using var migrationIdCmd = connection.CreateCommand();
        migrationIdCmd.CommandText = """
            SELECT COUNT(*)
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = '__ef_migrations_history'
              AND column_name = 'migration_id'
            """;
        var migrationIdCount = await migrationIdCmd.ExecuteScalarAsync();
        Assert.Equal(1L, migrationIdCount);

        // THEN: product_version column must exist (snake_case)
        await using var productVersionCmd = connection.CreateCommand();
        productVersionCmd.CommandText = """
            SELECT COUNT(*)
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = '__ef_migrations_history'
              AND column_name = 'product_version'
            """;
        var productVersionCount = await productVersionCmd.ExecuteScalarAsync();
        Assert.Equal(1L, productVersionCount);

        // THEN: PascalCase column MigrationId must NOT exist (would indicate naming not applied)
        await using var pascalCmd = connection.CreateCommand();
        pascalCmd.CommandText = """
            SELECT COUNT(*)
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = '__ef_migrations_history'
              AND column_name = 'MigrationId'
            """;
        var pascalCount = await pascalCmd.ExecuteScalarAsync();
        Assert.Equal(0L, pascalCount);
    }

    // -------------------------------------------------------------------------
    // TC-E1-P0-05 (P0): ExceptionHandlingMiddleware Returns Problem Details RFC 7807
    // AC3 — Content-Type: application/problem+json, status/title/detail, no stackTrace
    // -------------------------------------------------------------------------

    /// <summary>
    /// GIVEN: An unhandled exception occurs in the backend
    /// WHEN:  The error reaches ExceptionHandlingMiddleware
    /// THEN:  Response returns HTTP 500 with Content-Type application/problem+json
    /// RED:   Fails if ExceptionHandlingMiddleware is not registered or Program.cs not wired
    /// </summary>
    [Fact]
    public async Task GivenUnhandledException_WhenErrorReachesMiddleware_ThenResponseIsApplicationProblemJson()
    {
        // GIVEN: A test endpoint that intentionally throws an exception
        // Use CreateFactory() to keep the real Program.cs pipeline intact (middleware + routes)
        await using var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(host =>
            {
                host.UseSetting(
                    "ConnectionStrings:DefaultConnection",
                    _postgres.GetConnectionString());
                // NOTE: Do NOT call host.Configure() here — it replaces the entire pipeline
                // and removes ExceptionHandlingMiddleware from Program.cs.
                // UseSetting alone is sufficient to inject the test DB connection string.
            });

        using var client = factory.CreateClient();

        // WHEN: Calling a test endpoint that triggers an unhandled exception
        // The endpoint GET /api/v1/test-error must be registered in Program.cs (test mode) or here
        var response = await client.GetAsync("/api/v1/test-error");

        // THEN: Response status must be 500 Internal Server Error
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);

        // THEN: Content-Type must be application/problem+json
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    /// <summary>
    /// GIVEN: An unhandled exception occurs in the backend
    /// WHEN:  The Problem Details response body is inspected
    /// THEN:  Body contains status, title, detail fields with NO stackTrace or exception key
    /// RED:   Fails if ExceptionHandlingMiddleware returns raw exception or missing fields
    /// </summary>
    [Fact]
    public async Task GivenUnhandledException_WhenProblemDetailsBodyInspected_ThenContainsRequiredFieldsWithNoStackTrace()
    {
        // GIVEN: A WebApplicationFactory pointing to test database
        await using var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(host =>
            {
                host.UseSetting(
                    "ConnectionStrings:DefaultConnection",
                    _postgres.GetConnectionString());
            });

        using var client = factory.CreateClient();

        // WHEN: Triggering an unhandled exception via GET /api/v1/test-error
        var response = await client.GetAsync("/api/v1/test-error");

        // THEN: Parse the response body as JSON
        var body = await response.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();

        // THEN: Required Problem Details fields must be present
        Assert.True(body.TryGetProperty("status", out var statusProp), "Missing required 'status' field");
        Assert.True(body.TryGetProperty("title", out _), "Missing required 'title' field");
        Assert.True(body.TryGetProperty("detail", out _), "Missing required 'detail' field");

        // THEN: Status field value must be 500
        Assert.Equal(500, statusProp.GetInt32());

        // THEN: stackTrace must NOT be present (NFR6 — no raw exception exposure)
        Assert.False(body.TryGetProperty("stackTrace", out _), "Response must NOT contain 'stackTrace' (NFR6 violation)");
        Assert.False(body.TryGetProperty("exception", out _), "Response must NOT contain 'exception' (NFR6 violation)");
        Assert.False(body.TryGetProperty("innerException", out _), "Response must NOT contain 'innerException' (NFR6 violation)");
    }

    // -------------------------------------------------------------------------
    // AC6 — AppDbContext resolves from DI container with Npgsql provider
    // -------------------------------------------------------------------------

    /// <summary>
    /// GIVEN: Connection string configured in appsettings.Development.json
    /// WHEN:  AppDbContext is registered in Program.cs and resolved from DI
    /// THEN:  DI container resolves AppDbContext without error using Npgsql provider
    /// RED:   Fails because AppDbContext class and AddDbContext registration do not exist yet
    /// </summary>
    [Fact]
    public async Task GivenConnectionStringConfigured_WhenAppDbContextResolvedFromDI_ThenNpgsqlProviderIsUsed()
    {
        // GIVEN: A WebApplicationFactory with the test PostgreSQL connection string
        await using var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(host =>
            {
                host.UseSetting(
                    "ConnectionStrings:DefaultConnection",
                    _postgres.GetConnectionString());
            });

        // WHEN: Resolving AppDbContext from the DI container
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetService<SiesaAgents.Infrastructure.Data.AppDbContext>();

        // THEN: AppDbContext must be resolved (not null)
        Assert.NotNull(dbContext);

        // THEN: The database provider must be Npgsql (PostgreSQL)
        var providerName = dbContext.Database.ProviderName;
        Assert.Equal("Npgsql.EntityFrameworkCore.PostgreSQL", providerName);

        // Cleanup: ensure container is released
        await dbContext.DisposeAsync();
    }
}
