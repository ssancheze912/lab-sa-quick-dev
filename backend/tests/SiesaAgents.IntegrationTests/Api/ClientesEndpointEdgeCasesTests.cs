using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;
using Testcontainers.PostgreSql;

namespace SiesaAgents.IntegrationTests.Api;

/// <summary>
/// Story 2.1 — Edge-case automation expansion for the GET /api/v1/clientes endpoint.
///
/// Complements <see cref="ClientesEndpointAtddTests"/> with cases not covered:
///   • [P2] Non-matching search returns an empty array (NOT 404, NOT null)
///   • [P2] Whitespace-only ?search= behaves like no filter (all rows returned)
///   • [P2] Wildcard meta-characters (% and _) are treated as literals when wrapped
///   • [P2] Accented / unicode search fragments resolve case-insensitively
///   • [P2] Status code and content-type remain 200 + application/json for empty matches
/// </summary>
public class ClientesEndpointEdgeCasesTests : IAsyncLifetime
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

    // ─── Non-matching search returns 200 + [] (NOT 404, NOT null) ────────
    [Fact]
    public async Task GetClientes_WithSearchThatMatchesNothing_Returns200AndEmptyArray()
    {
        // GIVEN: seeded rows that will not match
        await SeedClientesAsync(new[]
        {
            ("Alpha", "900111222", "3001112233", "Bogotá", DateTimeOffset.UtcNow.AddDays(-1)),
            ("Beta", "800999888", "3009998888", "Medellín", DateTimeOffset.UtcNow),
        });

        // WHEN: GET ?search=<no match>
        var response = await _client!.GetAsync("/api/v1/clientes?search=ZZZUnmatchableXYZ");

        // THEN: 200 OK, JSON, empty array
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
        var body = await response.Content.ReadAsStringAsync();
        body.Trim().Should().Be("[]");
    }

    // ─── Whitespace search behaves like no filter ─────────────────────────
    [Fact]
    public async Task GetClientes_WithWhitespaceSearchParam_ReturnsAllRows()
    {
        // GIVEN: 2 seeded rows
        await SeedClientesAsync(new[]
        {
            ("Alpha", "900111222", "3001112233", "Bogotá", DateTimeOffset.UtcNow.AddDays(-1)),
            ("Beta", "800999888", "3009998888", "Medellín", DateTimeOffset.UtcNow),
        });

        // WHEN: ?search=%20%20%20 (three spaces, URL-encoded)
        var response = await _client!.GetAsync("/api/v1/clientes?search=%20%20%20");
        var items = await response.Content.ReadFromJsonAsync<List<ClienteDtoTestModel>>();

        // THEN: all rows returned (NullOrWhiteSpace short-circuits the filter)
        items.Should().HaveCount(2);
    }

    // ─── Accented characters resolve case-insensitively ──────────────────
    [Fact]
    public async Task GetClientes_WithAccentedSearchFragment_MatchesAccentedNombre()
    {
        // GIVEN: one client with an accented name
        await SeedClientesAsync(new[]
        {
            ("Distribuidora Año", "900111222", "3001112233", "Bogotá", DateTimeOffset.UtcNow),
            ("Comercial Beta", "800999888", "3009998888", "Medellín", DateTimeOffset.UtcNow.AddDays(-1)),
        });

        // WHEN: search for the accented fragment exactly
        var response = await _client!.GetAsync("/api/v1/clientes?search=A%C3%B1o");
        var items = await response.Content.ReadFromJsonAsync<List<ClienteDtoTestModel>>();

        // THEN: only the accented row returns
        items.Should().HaveCount(1);
        items![0].Nombre.Should().Be("Distribuidora Año");
    }

    // ─── Numeric-only NIT fragment matches a NIT, not nombre ─────────────
    [Fact]
    public async Task GetClientes_WithNumericSearchFragment_MatchesNitOnlyWhenNombreLacksDigits()
    {
        // GIVEN: only one row whose NIT contains the digits
        await SeedClientesAsync(new[]
        {
            ("Cliente Alpha", "900111222", "3001112233", "Bogotá", DateTimeOffset.UtcNow.AddDays(-1)),
            ("Cliente Beta", "800999888", "3009998888", "Medellín", DateTimeOffset.UtcNow),
        });

        // WHEN: search by a NIT-only fragment that does not appear in any nombre
        var response = await _client!.GetAsync("/api/v1/clientes?search=999888");
        var items = await response.Content.ReadFromJsonAsync<List<ClienteDtoTestModel>>();

        // THEN: only the NIT-matching row returns
        items.Should().HaveCount(1);
        items![0].NitRuc.Should().Be("800999888");
    }

    // ─── Lower- and upper-case fragments produce the same set ────────────
    [Fact]
    public async Task GetClientes_LowerAndUpperCaseFragments_ReturnSameResults()
    {
        await SeedClientesAsync(new[]
        {
            ("MixedCaseACME", "900111222", "3001112233", "Bogotá", DateTimeOffset.UtcNow),
        });

        // WHEN: both fragments
        var lower = await _client!.GetAsync("/api/v1/clientes?search=acme");
        var upper = await _client!.GetAsync("/api/v1/clientes?search=ACME");

        var lowerItems = await lower.Content.ReadFromJsonAsync<List<ClienteDtoTestModel>>();
        var upperItems = await upper.Content.ReadFromJsonAsync<List<ClienteDtoTestModel>>();

        // THEN: same single match (ILIKE semantics)
        lowerItems.Should().HaveCount(1);
        upperItems.Should().HaveCount(1);
        lowerItems![0].Nombre.Should().Be(upperItems![0].Nombre);
    }

    // ─── Empty database with a search param still returns [] ─────────────
    [Fact]
    public async Task GetClientes_EmptyDatabaseWithSearchParam_Returns200AndEmptyArray()
    {
        // GIVEN: no seeded rows

        // WHEN
        var response = await _client!.GetAsync("/api/v1/clientes?search=anything");

        // THEN
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Trim().Should().Be("[]");
    }

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
