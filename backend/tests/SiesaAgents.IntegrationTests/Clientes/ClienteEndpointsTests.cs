// ATDD Integration Tests — Story 2.1: Client List & Search
//
// RED Phase: These tests fail until ClienteEntity, ClienteRepository, and
// GET /api/v1/clientes endpoint are implemented.
//
// Covers:
//   AC5 — TC-E2-P1-01: GET /api/v1/clientes returns 200 with direct JSON array
//
// Pattern: xUnit + WebApplicationFactory<Program> + TestContainers (PostgreSQL)
//          Given-When-Then naming convention

using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Infrastructure.Data;
using Testcontainers.PostgreSql;
using Xunit;

namespace SiesaAgents.IntegrationTests.Clientes;

// ---------------------------------------------------------------------------
// Test collection fixture — shared Postgres container for all tests in class
// ---------------------------------------------------------------------------

public class ClienteEndpointsTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:18-alpine")
        .WithDatabase("siesa_agents_test")
        .WithUsername("test")
        .WithPassword("test")
        .Build();

    private HttpClient _client = null!;
    private WebApplicationFactory<Program> _factory = null!;

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();

        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Remove the existing AppDbContext registration
                    var descriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                    if (descriptor != null)
                        services.Remove(descriptor);

                    // Register AppDbContext with the TestContainers Postgres connection
                    services.AddDbContext<AppDbContext>(options =>
                        options.UseNpgsql(_postgres.GetConnectionString())
                               .UseSnakeCaseNamingConvention());
                });
            });

        // Ensure schema is created
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureCreatedAsync();

        _client = _factory.CreateClient();
    }

    public async Task DisposeAsync()
    {
        await _postgres.DisposeAsync();
        _client.Dispose();
        await _factory.DisposeAsync();
    }

    // Helper: seed clients via AppDbContext directly
    private async Task SeedClientesAsync(int count = 3)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var clientes = new[]
        {
            ClienteEntity.Create("Empresa Uno", "111000001-1", "3001111111", "Bogotá"),
            ClienteEntity.Create("Empresa Dos", "222000002-2", "3002222222", "Medellín"),
            ClienteEntity.Create("Empresa Tres", "333000003-3", "3003333333", "Cali"),
        };

        db.Clientes.AddRange(clientes.Take(count));
        await db.SaveChangesAsync();
    }

    private async Task ClearClientesAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Clientes.RemoveRange(db.Clientes);
        await db.SaveChangesAsync();
    }

    // -------------------------------------------------------------------------
    // TC-E2-P1-01 — GET /api/v1/clientes returns HTTP 200
    // AC5: Response is a direct JSON array (not wrapped object)
    // -------------------------------------------------------------------------

    [Fact]
    public async Task GivenThreeClientesPreSeeded_WhenGetApiV1Clientes_ThenReturns200OK()
    {
        // GIVEN: Three clients pre-seeded in the database
        await ClearClientesAsync();
        await SeedClientesAsync(3);

        // WHEN: GET /api/v1/clientes
        var response = await _client.GetAsync("/api/v1/clientes");

        // THEN: HTTP 200 OK
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GivenThreeClientesPreSeeded_WhenGetApiV1Clientes_ThenResponseBodyIsJsonArray()
    {
        // GIVEN: Three clients pre-seeded
        await ClearClientesAsync();
        await SeedClientesAsync(3);

        // WHEN: GET /api/v1/clientes
        var response = await _client.GetAsync("/api/v1/clientes");
        var content = await response.Content.ReadAsStringAsync();

        // THEN: Response body is a JSON array (not wrapped in an object)
        using var document = JsonDocument.Parse(content);
        document.RootElement.ValueKind.Should().Be(JsonValueKind.Array,
            "the endpoint must return a direct JSON array, not an object wrapper");
    }

    [Fact]
    public async Task GivenThreeClientesPreSeeded_WhenGetApiV1Clientes_ThenResponseContainsAllThreeClients()
    {
        // GIVEN: Three clients pre-seeded
        await ClearClientesAsync();
        await SeedClientesAsync(3);

        // WHEN: GET /api/v1/clientes
        var response = await _client.GetAsync("/api/v1/clientes");
        var content = await response.Content.ReadAsStringAsync();

        // THEN: All three clients are present in the array
        using var document = JsonDocument.Parse(content);
        document.RootElement.GetArrayLength().Should().Be(3,
            "all three pre-seeded clients must be returned");
    }

    [Fact]
    public async Task GivenThreeClientesPreSeeded_WhenGetApiV1Clientes_ThenEachItemContainsIdField()
    {
        // GIVEN: Three clients pre-seeded
        await ClearClientesAsync();
        await SeedClientesAsync(3);

        // WHEN: GET /api/v1/clientes
        var response = await _client.GetAsync("/api/v1/clientes");
        var content = await response.Content.ReadAsStringAsync();

        // THEN: Each item contains 'id' as a non-empty UUID
        using var document = JsonDocument.Parse(content);
        foreach (var item in document.RootElement.EnumerateArray())
        {
            item.TryGetProperty("id", out var idProp).Should().BeTrue("each item must have an 'id' field");
            Guid.TryParse(idProp.GetString(), out _).Should().BeTrue("'id' must be a valid UUID");
        }
    }

    [Fact]
    public async Task GivenThreeClientesPreSeeded_WhenGetApiV1Clientes_ThenEachItemContainsNombreField()
    {
        // GIVEN: Three clients pre-seeded
        await ClearClientesAsync();
        await SeedClientesAsync(3);

        // WHEN: GET /api/v1/clientes
        var response = await _client.GetAsync("/api/v1/clientes");
        var content = await response.Content.ReadAsStringAsync();

        // THEN: Each item contains 'nombre' field
        using var document = JsonDocument.Parse(content);
        foreach (var item in document.RootElement.EnumerateArray())
        {
            item.TryGetProperty("nombre", out var nombreProp).Should().BeTrue("each item must have a 'nombre' field");
            nombreProp.GetString().Should().NotBeNullOrEmpty("'nombre' must not be empty");
        }
    }

    [Fact]
    public async Task GivenThreeClientesPreSeeded_WhenGetApiV1Clientes_ThenEachItemContainsNitField()
    {
        // GIVEN: Three clients pre-seeded
        await ClearClientesAsync();
        await SeedClientesAsync(3);

        // WHEN: GET /api/v1/clientes
        var response = await _client.GetAsync("/api/v1/clientes");
        var content = await response.Content.ReadAsStringAsync();

        // THEN: Each item contains 'nit' field
        using var document = JsonDocument.Parse(content);
        foreach (var item in document.RootElement.EnumerateArray())
        {
            item.TryGetProperty("nit", out var nitProp).Should().BeTrue("each item must have a 'nit' field");
            nitProp.GetString().Should().NotBeNullOrEmpty("'nit' must not be empty");
        }
    }

    [Fact]
    public async Task GivenThreeClientesPreSeeded_WhenGetApiV1Clientes_ThenEachItemContainsTelefonoField()
    {
        // GIVEN: Three clients pre-seeded
        await ClearClientesAsync();
        await SeedClientesAsync(3);

        // WHEN: GET /api/v1/clientes
        var response = await _client.GetAsync("/api/v1/clientes");
        var content = await response.Content.ReadAsStringAsync();

        // THEN: Each item contains 'telefono' field
        using var document = JsonDocument.Parse(content);
        foreach (var item in document.RootElement.EnumerateArray())
        {
            item.TryGetProperty("telefono", out _).Should().BeTrue("each item must have a 'telefono' field");
        }
    }

    [Fact]
    public async Task GivenThreeClientesPreSeeded_WhenGetApiV1Clientes_ThenEachItemContainsCiudadField()
    {
        // GIVEN: Three clients pre-seeded
        await ClearClientesAsync();
        await SeedClientesAsync(3);

        // WHEN: GET /api/v1/clientes
        var response = await _client.GetAsync("/api/v1/clientes");
        var content = await response.Content.ReadAsStringAsync();

        // THEN: Each item contains 'ciudad' field
        using var document = JsonDocument.Parse(content);
        foreach (var item in document.RootElement.EnumerateArray())
        {
            item.TryGetProperty("ciudad", out _).Should().BeTrue("each item must have a 'ciudad' field");
        }
    }

    [Fact]
    public async Task GivenThreeClientesPreSeeded_WhenGetApiV1Clientes_ThenEachItemContainsCreatedAtAsIso8601()
    {
        // GIVEN: Three clients pre-seeded
        await ClearClientesAsync();
        await SeedClientesAsync(3);

        // WHEN: GET /api/v1/clientes
        var response = await _client.GetAsync("/api/v1/clientes");
        var content = await response.Content.ReadAsStringAsync();

        // THEN: Each item contains 'createdAt' as a valid DateTimeOffset ISO 8601 string
        using var document = JsonDocument.Parse(content);
        foreach (var item in document.RootElement.EnumerateArray())
        {
            item.TryGetProperty("createdAt", out var createdAtProp).Should().BeTrue(
                "each item must have a 'createdAt' field");

            var rawValue = createdAtProp.GetString();
            rawValue.Should().NotBeNullOrEmpty("'createdAt' must not be empty");

            DateTimeOffset.TryParse(rawValue, out var parsed).Should().BeTrue(
                $"'createdAt' value '{rawValue}' must be a valid DateTimeOffset ISO 8601 string");

            // Must include timezone info — never bare DateTime
            rawValue.Should().MatchRegex(@"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}",
                "'createdAt' must follow ISO 8601 format with date and time components");
        }
    }

    [Fact]
    public async Task GivenThreeClientesPreSeeded_WhenGetApiV1Clientes_ThenEachItemContainsUpdatedAtAsIso8601()
    {
        // GIVEN: Three clients pre-seeded
        await ClearClientesAsync();
        await SeedClientesAsync(3);

        // WHEN: GET /api/v1/clientes
        var response = await _client.GetAsync("/api/v1/clientes");
        var content = await response.Content.ReadAsStringAsync();

        // THEN: Each item contains 'updatedAt' as a valid DateTimeOffset ISO 8601 string
        using var document = JsonDocument.Parse(content);
        foreach (var item in document.RootElement.EnumerateArray())
        {
            item.TryGetProperty("updatedAt", out var updatedAtProp).Should().BeTrue(
                "each item must have an 'updatedAt' field");

            var rawValue = updatedAtProp.GetString();
            rawValue.Should().NotBeNullOrEmpty("'updatedAt' must not be empty");

            DateTimeOffset.TryParse(rawValue, out _).Should().BeTrue(
                $"'updatedAt' value '{rawValue}' must be a valid DateTimeOffset ISO 8601 string");
        }
    }

    [Fact]
    public async Task GivenThreeClientesPreSeeded_WhenGetApiV1Clientes_ThenContentTypeIsApplicationJson()
    {
        // GIVEN: Three clients pre-seeded
        await ClearClientesAsync();
        await SeedClientesAsync(3);

        // WHEN: GET /api/v1/clientes
        var response = await _client.GetAsync("/api/v1/clientes");

        // THEN: Content-Type is application/json
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json",
            "the endpoint must return JSON content");
    }

    [Fact]
    public async Task GivenNoClientsInDatabase_WhenGetApiV1Clientes_ThenReturns200WithEmptyArray()
    {
        // GIVEN: Empty database
        await ClearClientesAsync();

        // WHEN: GET /api/v1/clientes
        var response = await _client.GetAsync("/api/v1/clientes");
        var content = await response.Content.ReadAsStringAsync();

        // THEN: HTTP 200 with empty array (not 404)
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        using var document = JsonDocument.Parse(content);
        document.RootElement.ValueKind.Should().Be(JsonValueKind.Array);
        document.RootElement.GetArrayLength().Should().Be(0);
    }
}
