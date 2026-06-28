using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;
using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace SiesaAgents.UnitTests.Clientes;

/// <summary>
/// ATDD tests — Story 2.1: Client List &amp; Search (RED phase)
/// Tests fail until ClienteEntity, GET /api/v1/clientes endpoint, and EF Core migration are implemented.
///
/// Test IDs covered:
///   TC-E2-2-1-API-1 (P0) — GET /api/v1/clientes returns 200 + empty array
///   TC-E2-2-1-API-2 (P0) — GET /api/v1/clientes with seeded client returns array with 1 item
///   TC-E2-2-1-API-3 (P3) — uk_clientes_nit unique index exists in DB
/// </summary>
public class GetClientesApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public GetClientesApiTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-1-API-1 (P0) — GET /api/v1/clientes returns 200 + JSON array
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-1-API-1 (P0)
    /// GIVEN the backend is running and the clientes table exists
    /// WHEN GET /api/v1/clientes is called with an empty database
    /// THEN the response status is 200 OK and the body is an empty JSON array
    /// </summary>
    [Fact]
    public async Task GetClientes_WhenDatabaseEmpty_Returns200WithEmptyArray()
    {
        // GIVEN: Backend is running with empty clientes table
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.MigrateAsync();

        // Remove any existing clientes so the state is predictable
        // (Clientes property may not exist yet — test will fail in RED phase)
        await dbContext.Database.ExecuteSqlRawAsync("DELETE FROM clientes");

        // WHEN: GET /api/v1/clientes is called
        var response = await _client.GetAsync("/api/v1/clientes");

        // THEN: Response is 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // AND: Body is a JSON array (empty)
        var body = await response.Content.ReadFromJsonAsync<List<object>>();
        Assert.NotNull(body);
        Assert.Empty(body);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-1-API-2 (P0) — GET /api/v1/clientes returns seeded client
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-1-API-2 (P0)
    /// GIVEN a client named "Acme S.A." with NIT "900123456-1" exists in the system
    /// WHEN GET /api/v1/clientes is called
    /// THEN the response contains an array with exactly 1 item matching Nombre and Nit
    /// </summary>
    [Fact]
    public async Task GetClientes_WithSeededCliente_Returns200WithClienteInArray()
    {
        // GIVEN: One client seeded via POST
        var payload = new
        {
            nombre = "Acme S.A.",
            nit = $"900{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() % 1_000_000:D6}-1",
            telefono = "3001234567",
            ciudad = "Bogotá"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/clientes", payload);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var createdCliente = await createResponse.Content.ReadFromJsonAsync<ClienteResponse>();
        Assert.NotNull(createdCliente);

        try
        {
            // WHEN: GET /api/v1/clientes is called
            var response = await _client.GetAsync("/api/v1/clientes");

            // THEN: Response is 200 OK
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            // AND: Array contains the seeded client with correct Nombre and Nit
            var body = await response.Content.ReadFromJsonAsync<List<ClienteResponse>>();
            Assert.NotNull(body);
            Assert.True(body.Any(c => c.Nombre == payload.nombre && c.Nit == payload.nit),
                $"Expected to find client with Nombre='{payload.nombre}' and Nit='{payload.nit}' in response.");
        }
        finally
        {
            // Cleanup: Delete seeded client
            await _client.DeleteAsync($"/api/v1/clientes/{createdCliente!.Id}");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-1-API-3 (P3) — uk_clientes_nit unique index exists in DB
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-1-API-3 (P3)
    /// GIVEN the clientes table exists with ClienteConfiguration applied
    /// WHEN information_schema.table_constraints is queried for the clientes table
    /// THEN a unique constraint named "uk_clientes_nit" exists
    /// </summary>
    [Fact]
    public async Task ClientesTable_WhenMigrationApplied_HasUkClientesNitUniqueIndex()
    {
        // GIVEN: Migration is applied and clientes table exists
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.MigrateAsync();

        // WHEN: information_schema is queried for the unique constraint
        var connection = dbContext.Database.GetDbConnection();
        await connection.OpenAsync();

        string? constraintName = null;
        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = @"
                SELECT constraint_name
                FROM information_schema.table_constraints
                WHERE table_name = 'clientes'
                  AND constraint_type = 'UNIQUE'
                  AND constraint_name = 'uk_clientes_nit';
            ";
            constraintName = (string?)await command.ExecuteScalarAsync();
        }
        finally
        {
            await connection.CloseAsync();
        }

        // THEN: uk_clientes_nit unique constraint exists
        Assert.Equal("uk_clientes_nit", constraintName,
            "The 'uk_clientes_nit' unique index must exist on the clientes table. " +
            "Add HasIndex(c => c.Nit).IsUnique().HasDatabaseName(\"uk_clientes_nit\") to ClienteConfiguration.");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Response DTO (matches GET /api/v1/clientes JSON shape)
    // ─────────────────────────────────────────────────────────────────────────

    private sealed record ClienteResponse(
        Guid Id,
        string Nombre,
        string Nit,
        string Telefono,
        string Ciudad,
        DateTimeOffset CreatedAt,
        DateTimeOffset UpdatedAt
    );
}
