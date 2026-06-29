using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;
using Testcontainers.PostgreSql;

namespace SiesaAgents.IntegrationTests.Api;

/// <summary>
/// Story 2.2 — Client Detail View — API integration tests.
///
/// Acceptance criteria covered:
///   AC #1 — GET /api/v1/clientes/{id} returns 200 + ClienteDto when the row exists.
///   AC #2 — GET /api/v1/clientes/{id} returns 404 + RFC 7807 Problem Details
///           when the row does NOT exist, with no leakage of internal field names
///           (NFR6).
///   AC #3 — GET /api/v1/clientes/{not-a-guid} returns 400 (route-constraint failure).
/// </summary>
public class ClienteByIdEndpointTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:18")
        .WithDatabase("siesa_agents_db")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .Build();

    private WebApplicationFactory<Program>? _factory;
    private HttpClient? _client;

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();

        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    var descriptor = services.FirstOrDefault(d =>
                        d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                    if (descriptor is not null)
                    {
                        services.Remove(descriptor);
                    }
                    services.AddDbContext<AppDbContext>(options =>
                        options.UseNpgsql(_postgres.GetConnectionString()));
                });
            });

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await db.Database.MigrateAsync();
        }

        _client = _factory.CreateClient();
    }

    public async Task DisposeAsync()
    {
        _client?.Dispose();
        if (_factory is not null) await _factory.DisposeAsync();
        await _postgres.DisposeAsync();
    }

    // ─── AC #1 — 200 OK + ClienteDto shape (camelCase) ───────────────────────
    [Fact]
    public async Task GetClienteById_ReturnsOkAndDto_WhenIdExists()
    {
        // GIVEN: a seeded client
        var id = await SeedClienteAsync("ACME Detail SAS", "900111222", "3001234567", "Bogotá");

        // WHEN: GET /api/v1/clientes/{id}
        var response = await _client!.GetAsync($"/api/v1/clientes/{id}");

        // THEN: 200 OK, application/json, and the body matches the seeded client
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        root.GetProperty("id").GetGuid().Should().Be(id);
        root.GetProperty("nombre").GetString().Should().Be("ACME Detail SAS");
        root.GetProperty("nitRuc").GetString().Should().Be("900111222");
        root.GetProperty("telefono").GetString().Should().Be("3001234567");
        root.GetProperty("ciudad").GetString().Should().Be("Bogotá");
        root.TryGetProperty("createdAt", out _).Should().BeTrue();
        root.TryGetProperty("updatedAt", out _).Should().BeTrue();
    }

    // ─── AC #2 — 404 + Problem Details with no internal leakage ─────────────
    [Fact]
    public async Task GetClienteById_Returns404Problem_WhenIdDoesNotExist()
    {
        // GIVEN: an empty database
        var missingId = Guid.NewGuid();

        // WHEN: GET /api/v1/clientes/{missingId}
        var response = await _client!.GetAsync($"/api/v1/clientes/{missingId}");

        // THEN: 404, application/problem+json, RFC 7807 body
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
        contentType.Should().StartWith("application/problem+json");

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        root.GetProperty("status").GetInt32().Should().Be(404);
        root.GetProperty("title").GetString().Should().Be("Cliente no encontrado");
        root.GetProperty("type").GetString().Should().NotBeNullOrEmpty();
        root.GetProperty("instance").GetString().Should().Be($"/api/v1/clientes/{missingId}");

        // NFR6 — no internal-detail leakage
        json.Should().NotContain("ClienteEntity");
        json.Should().NotContain("DbContext");
        json.Should().NotContain("\"Nit\"");
        json.Should().NotContain("SELECT", "no SQL fragments should leak");
        json.Should().NotContain("Stack");
    }

    // ─── AC #3 — invalid UUID → 400 (route-constraint failure) ──────────────
    [Fact]
    public async Task GetClienteById_Returns400_WhenIdIsNotAGuid()
    {
        // WHEN: GET /api/v1/clientes/not-a-guid
        var response = await _client!.GetAsync("/api/v1/clientes/not-a-guid");

        // THEN: 400 BadRequest (Minimal API route-constraint failure)
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    /// <summary>
    /// Seeds a single client via raw SQL to keep the test independent of EF
    /// migrations evolving over time.
    /// </summary>
    private async Task<Guid> SeedClienteAsync(string nombre, string nit, string telefono, string ciudad)
    {
        var id = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;
        await using var conn = new Npgsql.NpgsqlConnection(_postgres.GetConnectionString());
        await conn.OpenAsync();
        await using var cmd = new Npgsql.NpgsqlCommand(
            @"INSERT INTO clientes (id, nombre, nit, telefono, ciudad, created_at, updated_at)
              VALUES (@id, @nombre, @nit, @telefono, @ciudad, @created_at, @created_at);",
            conn);
        cmd.Parameters.AddWithValue("id", id);
        cmd.Parameters.AddWithValue("nombre", nombre);
        cmd.Parameters.AddWithValue("nit", nit);
        cmd.Parameters.AddWithValue("telefono", telefono);
        cmd.Parameters.AddWithValue("ciudad", ciudad);
        cmd.Parameters.AddWithValue("created_at", now);
        await cmd.ExecuteNonQueryAsync();
        return id;
    }
}
