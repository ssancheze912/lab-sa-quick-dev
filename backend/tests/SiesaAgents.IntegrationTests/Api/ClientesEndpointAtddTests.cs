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
/// Story 2.1 — Client List & Search — API ATDD (RED phase).
///
/// Acceptance criteria covered:
///   AC #1 — clientes table migration (schema asserted via Data/ClientesSchemaAtddTests.cs)
///   AC #2 — GET /api/v1/clientes contract (200, empty [], ClienteDto shape, ?search filter)
///
/// Aligned test cases:
///   TC-E2-P0-04 (API leg, partial) — search filtering correctness (perf is asserted separately)
///   TC-E2-P2-04 (API leg)          — search matches Nombre + NIT case-insensitively
///
/// These tests MUST fail until the Cliente domain entity, EF config, repository,
/// query handler, and Minimal API endpoint exist.
/// </summary>
public class ClientesEndpointAtddTests : IAsyncLifetime
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

    // ─── AC #2 — empty body returns [] (NOT null, NOT 204) ────────────────
    [Fact]
    public async Task GetClientes_EmptyDatabase_Returns200WithEmptyArray()
    {
        // GIVEN: a fresh database with no clients

        // WHEN: GET /api/v1/clientes
        var response = await _client!.GetAsync("/api/v1/clientes");

        // THEN: 200 OK with empty JSON array
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");

        var body = await response.Content.ReadAsStringAsync();
        body.Trim().Should().Be("[]");
    }

    // ─── AC #2 — ClienteDto shape (camelCase) ─────────────────────────────
    [Fact]
    public async Task GetClientes_WithSeededRows_ReturnsClienteDtoShapeWithCamelCase()
    {
        // GIVEN: seed 3 clients with distinct createdAt values
        await SeedClientesAsync(new[]
        {
            ("Cliente A", "900111222", "3001112233", "Bogotá", DateTimeOffset.UtcNow.AddDays(-2)),
            ("Cliente B", "800999888", "3009998888", "Medellín", DateTimeOffset.UtcNow.AddDays(-1)),
            ("Cliente C", "700777666", "3007776666", "Cali", DateTimeOffset.UtcNow),
        });

        // WHEN: GET /api/v1/clientes
        var response = await _client!.GetAsync("/api/v1/clientes");

        // THEN: each item exposes the camelCase contract
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        doc.RootElement.GetArrayLength().Should().Be(3);

        var first = doc.RootElement[0];
        first.TryGetProperty("id", out _).Should().BeTrue("id must be camelCase");
        first.TryGetProperty("nombre", out _).Should().BeTrue();
        first.TryGetProperty("nitRuc", out _).Should().BeTrue("contract is nitRuc, not nit");
        first.TryGetProperty("telefono", out _).Should().BeTrue();
        first.TryGetProperty("ciudad", out _).Should().BeTrue();
        first.TryGetProperty("createdAt", out _).Should().BeTrue();
        first.TryGetProperty("updatedAt", out _).Should().BeTrue();
    }

    // ─── AC #2 — default ordering is createdAt desc ───────────────────────
    [Fact]
    public async Task GetClientes_ReturnsClientsOrderedByCreatedAtDesc()
    {
        // GIVEN: 3 clients with explicit creation order
        await SeedClientesAsync(new[]
        {
            ("Oldest", "900100100", "3001000000", "Bogotá", DateTimeOffset.UtcNow.AddDays(-3)),
            ("Middle", "900200200", "3002000000", "Medellín", DateTimeOffset.UtcNow.AddDays(-2)),
            ("Newest", "900300300", "3003000000", "Cali", DateTimeOffset.UtcNow.AddDays(-1)),
        });

        // WHEN: GET /api/v1/clientes
        var response = await _client!.GetAsync("/api/v1/clientes");
        var items = await response.Content.ReadFromJsonAsync<List<ClienteDtoTestModel>>();

        // THEN: order is Newest, Middle, Oldest
        items.Should().NotBeNull();
        items!.Select(c => c.Nombre).Should().ContainInOrder("Newest", "Middle", "Oldest");
    }

    // ─── AC #2 — ?search filter, case-insensitive, matches nombre OR nit ─
    [Fact]
    public async Task GetClientes_WithSearchParam_FiltersOnNombreCaseInsensitively()
    {
        // GIVEN: 3 distinct clients
        await SeedClientesAsync(new[]
        {
            ("Distribuidora Acme", "900111222", "3001112233", "Bogotá", DateTimeOffset.UtcNow.AddDays(-3)),
            ("ZetaCorp", "800999888", "3009998888", "Medellín", DateTimeOffset.UtcNow.AddDays(-2)),
            ("Beta Ltda", "700777666", "3007776666", "Cali", DateTimeOffset.UtcNow.AddDays(-1)),
        });

        // WHEN: search by a name fragment in different case
        var response = await _client!.GetAsync("/api/v1/clientes?search=acme");
        var items = await response.Content.ReadFromJsonAsync<List<ClienteDtoTestModel>>();

        // THEN: only ACME matches
        items.Should().HaveCount(1);
        items![0].Nombre.Should().Be("Distribuidora Acme");
    }

    [Fact]
    public async Task GetClientes_WithSearchParam_FiltersOnNitCaseInsensitively()
    {
        // GIVEN: 2 distinct clients with different NITs
        await SeedClientesAsync(new[]
        {
            ("Cliente A", "900111222", "3001112233", "Bogotá", DateTimeOffset.UtcNow.AddDays(-1)),
            ("Cliente B", "800999888", "3009998888", "Medellín", DateTimeOffset.UtcNow),
        });

        // WHEN: search by NIT fragment
        var response = await _client!.GetAsync("/api/v1/clientes?search=900111");
        var items = await response.Content.ReadFromJsonAsync<List<ClienteDtoTestModel>>();

        // THEN: only the NIT-matching client returns
        items.Should().HaveCount(1);
        items![0].Nombre.Should().Be("Cliente A");
    }

    // ─── AC #2 — empty search string returns all ──────────────────────────
    [Fact]
    public async Task GetClientes_WithBlankSearchParam_ReturnsAllRows()
    {
        // GIVEN: 2 seeded clients
        await SeedClientesAsync(new[]
        {
            ("Cliente A", "900111222", "3001112233", "Bogotá", DateTimeOffset.UtcNow.AddDays(-1)),
            ("Cliente B", "800999888", "3009998888", "Medellín", DateTimeOffset.UtcNow),
        });

        // WHEN: GET with ?search= (blank value)
        var response = await _client!.GetAsync("/api/v1/clientes?search=");
        var items = await response.Content.ReadFromJsonAsync<List<ClienteDtoTestModel>>();

        // THEN: all rows returned
        items.Should().HaveCount(2);
    }

    /// <summary>
    /// Seeds raw rows into the clientes table using ADO.NET so this test does NOT
    /// depend on the (yet-to-exist) ClienteEntity / DbSet<Cliente>. As soon as the
    /// entity ships, this helper still works because it targets snake_case columns.
    /// </summary>
    private async Task SeedClientesAsync(
        (string Nombre, string Nit, string Telefono, string Ciudad, DateTimeOffset CreatedAt)[] rows)
    {
        await using var conn = new Npgsql.NpgsqlConnection(_postgres.GetConnectionString());
        await conn.OpenAsync();
        foreach (var row in rows)
        {
            await using var cmd = new Npgsql.NpgsqlCommand(
                @"INSERT INTO clientes (id, nombre, nit, telefono, ciudad, created_at, updated_at)
                  VALUES (@id, @nombre, @nit, @telefono, @ciudad, @created_at, @created_at);",
                conn);
            cmd.Parameters.AddWithValue("id", Guid.NewGuid());
            cmd.Parameters.AddWithValue("nombre", row.Nombre);
            cmd.Parameters.AddWithValue("nit", row.Nit);
            cmd.Parameters.AddWithValue("telefono", row.Telefono);
            cmd.Parameters.AddWithValue("ciudad", row.Ciudad);
            cmd.Parameters.AddWithValue("created_at", row.CreatedAt);
            await cmd.ExecuteNonQueryAsync();
        }
    }

    private sealed record ClienteDtoTestModel(
        Guid Id,
        string Nombre,
        string NitRuc,
        string Telefono,
        string Ciudad,
        DateTimeOffset CreatedAt,
        DateTimeOffset UpdatedAt);
}
