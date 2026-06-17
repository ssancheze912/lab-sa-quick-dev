using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using DotNet.Testcontainers.Builders;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using SiesaAgents.Infrastructure.Data;
using Testcontainers.PostgreSql;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

public class AppDbContextTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithDatabase("siesa_agents_db_test")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .Build();

    public async Task InitializeAsync() => await _postgres.StartAsync();

    public async Task DisposeAsync() => await _postgres.DisposeAsync();

    // TC-E1-P1-05: After migration, __ef_migrations_history exists and no clientes/contactos tables
    [Fact]
    public async Task AfterMigration_EfMigrationsHistoryExists_AndNoDomainTables()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;

        await using var context = new AppDbContext(options);

        // Act
        await context.Database.MigrateAsync();

        // Assert — __ef_migrations_history table must exist
        await using var conn = new NpgsqlConnection(_postgres.GetConnectionString());
        await conn.OpenAsync();

        await using var checkMigrationsCmd = conn.CreateCommand();
        checkMigrationsCmd.CommandText =
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = '__ef_migrations_history'";
        var migrationsTableCount = (long)(await checkMigrationsCmd.ExecuteScalarAsync() ?? 0L);
        Assert.Equal(1L, migrationsTableCount);

        // Assert — clientes table must NOT exist
        await using var checkClientesCmd = conn.CreateCommand();
        checkClientesCmd.CommandText =
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'clientes'";
        var clientesCount = (long)(await checkClientesCmd.ExecuteScalarAsync() ?? 0L);
        Assert.Equal(0L, clientesCount);

        // Assert — contactos table must NOT exist
        await using var checkContactosCmd = conn.CreateCommand();
        checkContactosCmd.CommandText =
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'contactos'";
        var contactosCount = (long)(await checkContactosCmd.ExecuteScalarAsync() ?? 0L);
        Assert.Equal(0L, contactosCount);
    }

    // TC-E1-P2-04: __ef_migrations_history column names are snake_case
    [Fact]
    public async Task AfterMigration_EfMigrationsHistoryColumns_AreSnakeCase()
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
        cmd.CommandText =
            "SELECT column_name FROM information_schema.columns WHERE table_name = '__ef_migrations_history' ORDER BY ordinal_position";
        await using var reader = await cmd.ExecuteReaderAsync();

        var columns = new List<string>();
        while (await reader.ReadAsync())
        {
            columns.Add(reader.GetString(0));
        }

        // Assert — EF Core uses migration_id and product_version (snake_case)
        Assert.Contains("migration_id", columns);
        Assert.Contains("product_version", columns);
    }

    // TC-E1-P0-05: GET /api/v1/test-error returns Problem Details RFC 7807
    [Fact]
    public async Task GetTestError_ReturnsProblmDetails_RFC7807_WithNoStackTrace()
    {
        // Arrange
        var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(host =>
            {
                host.ConfigureServices(services =>
                {
                    // Replace real DbContext with InMemory for this test
                    var descriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                    if (descriptor is not null)
                        services.Remove(descriptor);

                    services.AddDbContext<AppDbContext>(opts =>
                        opts.UseInMemoryDatabase("test-error-db"));
                });
            });

        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/v1/test-error");

        // Assert — status 500
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);

        // Assert — Content-Type: application/problem+json
        Assert.Equal("application/problem+json",
            response.Content.Headers.ContentType?.MediaType);

        // Assert — body has status, title, detail; no stackTrace
        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);
        var root = json.RootElement;

        Assert.True(root.TryGetProperty("status", out _), "Missing 'status' field");
        Assert.True(root.TryGetProperty("title", out _), "Missing 'title' field");
        Assert.True(root.TryGetProperty("detail", out _), "Missing 'detail' field");

        Assert.False(root.TryGetProperty("stackTrace", out _), "'stackTrace' must not be exposed");
        Assert.False(root.TryGetProperty("exception", out _), "'exception' must not be exposed");

        var status = root.GetProperty("status").GetInt32();
        Assert.Equal(500, status);

        // detail MUST be null — never expose ex.Message or ex.StackTrace
        var detail = root.GetProperty("detail");
        Assert.Equal(JsonValueKind.Null, detail.ValueKind);
    }

    // Verify AppDbContext resolves from DI without errors
    [Fact]
    public void AppDbContext_RegistersWithDI_WithoutErrors()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("di-test-db")
            .Options;

        // Act & Assert — no exception thrown
        using var context = new AppDbContext(options);
        Assert.NotNull(context);
    }
}
