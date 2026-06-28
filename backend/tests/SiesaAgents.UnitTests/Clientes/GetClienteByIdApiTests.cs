using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;
using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace SiesaAgents.UnitTests.Clientes;

/// <summary>
/// ATDD integration tests — Story 2.2: Client Detail View
///
/// Test IDs covered:
///   TC-E2-2-2-API-1 (P1) — GET /api/v1/clientes/:id returns 200 + correct ClienteDto
///   TC-E2-2-2-API-2 (P1) — GET /api/v1/clientes/{unknown-uuid} returns 404 + Problem Details
/// </summary>
public class GetClienteByIdApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public GetClienteByIdApiTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-2-API-1 (P1) — GET /api/v1/clientes/:id returns 200 + ClienteDto
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-2-API-1 (P1)
    /// GIVEN a client exists in the system
    /// WHEN GET /api/v1/clientes/:id is called with the client's ID
    /// THEN the response is 200 OK with the correct ClienteDto JSON
    /// </summary>
    [Fact]
    public async Task GetClienteById_WhenClienteExists_Returns200WithCorrectDto()
    {
        // GIVEN: A client is seeded via POST
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.MigrateAsync();

        var payload = new
        {
            nombre = "Acme Detalle SA",
            nit = $"900{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() % 1_000_000:D6}-2",
            telefono = "3001234567",
            ciudad = "Bogotá"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/clientes", payload);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var created = await createResponse.Content.ReadFromJsonAsync<ClienteByIdResponse>();
        Assert.NotNull(created);

        try
        {
            // WHEN: GET /api/v1/clientes/:id is called
            var response = await _client.GetAsync($"/api/v1/clientes/{created!.Id}");

            // THEN: Response is 200 OK
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            // AND: Body matches the created client
            var body = await response.Content.ReadFromJsonAsync<ClienteByIdResponse>();
            Assert.NotNull(body);
            Assert.Equal(created.Id, body!.Id);
            Assert.Equal(payload.nombre, body.Nombre);
            Assert.Equal(payload.nit, body.Nit);
            Assert.Equal(payload.telefono, body.Telefono);
            Assert.Equal(payload.ciudad, body.Ciudad);
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/clientes/{created!.Id}");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-2-API-2 (P1) — GET /api/v1/clientes/{unknown-uuid} returns 404
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-2-API-2 (P1)
    /// GIVEN no client exists with the given ID
    /// WHEN GET /api/v1/clientes/{unknown-uuid} is called
    /// THEN the response is 404 with Problem Details RFC 7807 body
    /// </summary>
    [Fact]
    public async Task GetClienteById_WhenClienteNotFound_Returns404WithProblemDetails()
    {
        // GIVEN: A UUID that does not correspond to any existing client
        var unknownId = Guid.NewGuid();

        // WHEN: GET /api/v1/clientes/{unknown-uuid} is called
        var response = await _client.GetAsync($"/api/v1/clientes/{unknownId}");

        // THEN: Response is 404 Not Found
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        // AND: Body follows Problem Details RFC 7807
        var body = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();
        Assert.NotNull(body);
        Assert.Equal(404, body!.Status);
        Assert.Equal("Cliente no encontrado", body.Title);
        Assert.Equal("El cliente solicitado no fue encontrado.", body.Detail);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Response DTOs
    // ─────────────────────────────────────────────────────────────────────────

    private sealed record ClienteByIdResponse(
        Guid Id,
        string Nombre,
        string Nit,
        string Telefono,
        string Ciudad,
        DateTimeOffset CreatedAt,
        DateTimeOffset UpdatedAt
    );

    private sealed record ProblemDetailsResponse(
        int Status,
        string Title,
        string? Detail
    );
}
