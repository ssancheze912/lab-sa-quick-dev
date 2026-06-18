using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Integration Tests — GET /api/v1/clientes/{id} endpoint (Story 2.2)
/// RED phase: all tests fail until GetClienteByIdQueryHandler and endpoint are implemented.
///
/// Acceptance Criteria covered:
///   AC-2: direct URL /clientes/:clienteId loads correct data from GET /api/v1/clientes/:id
///   AC-3: unknown clienteId returns 404 Problem Details — no crash, no stack trace
///
/// Test matrix (test-design-epic-2.md — Story 2.2):
///   API-01 — GET /api/v1/clientes/{existingId} → 200 with correct ClienteDto fields (P0)
///   API-02 — GET /api/v1/clientes/{nonexistentUuid} → 404 Problem Details, no stackTrace (P1)
/// </summary>
public class GetClienteByIdTests
{
    // -------------------------------------------------------------------------
    // API-01 — Happy path: returns 200 with correct ClienteDto (P0)
    // -------------------------------------------------------------------------
    [Fact]
    public async Task GetClienteById_HappyPath_Returns200WithCorrectClienteDto()
    {
        // Arrange
        await using var factory = new ClientesTestFactory();

        Guid clienteId;
        const string expectedNombre = "Detail Test SA";
        const string expectedNit = "900200001";
        const string expectedTelefono = "3101000001";
        const string expectedCiudad = "Cali";

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var entity = ClienteEntity.Create(expectedNombre, expectedNit, expectedTelefono, expectedCiudad);
            db.Clientes.Add(entity);
            await db.SaveChangesAsync();
            clienteId = entity.Id;
        }

        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync($"/api/v1/clientes/{clienteId}");

        // Assert: 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        // Assert: response is an object (not an array)
        Assert.Equal(JsonValueKind.Object, root.ValueKind);

        // Assert: all required fields are present with correct values
        Assert.True(root.TryGetProperty("id", out var idProp), "Missing 'id' field");
        Assert.Equal(clienteId.ToString(), idProp.GetString());

        Assert.True(root.TryGetProperty("nombre", out var nombreProp), "Missing 'nombre' field");
        Assert.Equal(expectedNombre, nombreProp.GetString());

        Assert.True(root.TryGetProperty("nit", out var nitProp), "Missing 'nit' field");
        Assert.Equal(expectedNit, nitProp.GetString());

        Assert.True(root.TryGetProperty("telefono", out var telefonoProp), "Missing 'telefono' field");
        Assert.Equal(expectedTelefono, telefonoProp.GetString());

        Assert.True(root.TryGetProperty("ciudad", out var ciudadProp), "Missing 'ciudad' field");
        Assert.Equal(expectedCiudad, ciudadProp.GetString());

        Assert.True(root.TryGetProperty("createdAt", out _), "Missing 'createdAt' field");
    }

    // -------------------------------------------------------------------------
    // API-02 — Not found: returns 404 Problem Details, no stackTrace (P1, NFR6)
    // -------------------------------------------------------------------------
    [Fact]
    public async Task GetClienteById_UnknownId_Returns404ProblemDetails_WithoutStackTrace()
    {
        // Arrange: empty database — no seeding
        await using var factory = new ClientesTestFactory();
        var client = factory.CreateClient();

        var nonexistentId = Guid.NewGuid();

        // Act
        var response = await client.GetAsync($"/api/v1/clientes/{nonexistentId}");

        // Assert: 404 Not Found
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        // Assert: response is Problem Details (RFC 7807)
        Assert.Equal(JsonValueKind.Object, root.ValueKind);
        Assert.True(root.TryGetProperty("status", out var statusProp), "Missing 'status' field in Problem Details");
        Assert.Equal(404, statusProp.GetInt32());

        // Assert: no 'stackTrace' key in body (NFR6 — no internal details exposed)
        Assert.False(root.TryGetProperty("stackTrace", out _), "'stackTrace' must NOT appear in 404 response body");
        Assert.False(root.TryGetProperty("exception", out _), "'exception' must NOT appear in 404 response body");
    }
}
