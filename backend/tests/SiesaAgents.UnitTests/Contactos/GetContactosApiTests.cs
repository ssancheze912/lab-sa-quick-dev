using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;
using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace SiesaAgents.UnitTests.Contactos;

/// <summary>
/// ATDD tests — Story 3.1: Contact List &amp; Search (RED phase)
/// Tests fail until ContactoEntity, GET /api/v1/contactos endpoint, and EF Core migration are implemented.
///
/// Test IDs covered:
///   TC-E3-3-1-API-1 (P0) — GET /api/v1/contactos returns 200 + JSON array with nombre, cargo, email
///   TC-E3-3-1-API-2 (P0) — POST contacto + re-GET confirms record present in list
///   TC-E3-3-1-API-3 (P2) — contactos table has nullable cliente_id column (FK to clientes.id)
/// </summary>
public class GetContactosApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public GetContactosApiTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-1-API-1 (P0) — GET /api/v1/contactos returns 200 + JSON array
    //                         with nombre, cargo, email fields
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-1-API-1 (P0)
    /// GIVEN the backend is running and the contactos table exists
    /// WHEN GET /api/v1/contactos is called with at least one seeded contact
    /// THEN the response status is 200 OK and each item contains nombre, cargo, email fields
    /// </summary>
    [Fact]
    public async Task GetContactos_WhenContactoExists_Returns200WithNombreCargoEmailFields()
    {
        // GIVEN: One contact seeded via POST
        var payload = new
        {
            nombre = "María López Prueba",
            cargo = "Gerente Comercial",
            telefono = $"310{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() % 10_000_000:D7}",
            email = $"maria.lopez.{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}@test.co"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/contactos", payload);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var created = await createResponse.Content.ReadFromJsonAsync<ContactoResponse>();
        Assert.NotNull(created);

        try
        {
            // WHEN: GET /api/v1/contactos is called
            var response = await _client.GetAsync("/api/v1/contactos");

            // THEN: Response is 200 OK
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            // AND: Body is a JSON array
            var body = await response.Content.ReadFromJsonAsync<List<ContactoResponse>>();
            Assert.NotNull(body);
            Assert.True(body.Count > 0, "Expected at least one contacto in the response array.");

            // AND: Each item has nombre, cargo, and email fields (the created one is present)
            var found = body.FirstOrDefault(c => c.Email == payload.email);
            Assert.NotNull(found);
            Assert.Equal(payload.nombre, found!.Nombre);
            Assert.Equal(payload.cargo, found.Cargo);
            Assert.Equal(payload.email, found.Email);
        }
        finally
        {
            // Cleanup: Delete seeded contact
            await _client.DeleteAsync($"/api/v1/contactos/{created!.Id}");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-1-API-2 (P0) — POST contacto + re-GET confirms record in list
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-1-API-2 (P0)
    /// GIVEN a new contact payload with nombre, cargo, telefono, email
    /// WHEN POST /api/v1/contactos is called and then GET /api/v1/contactos is called
    /// THEN the created contact appears in the GET response array
    /// </summary>
    [Fact]
    public async Task PostContacto_ThenGetContactos_ReturnsCreatedContactInList()
    {
        // GIVEN: A valid new contact payload
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var payload = new
        {
            nombre = $"Juan Rodríguez {timestamp}",
            cargo = "Analista de Ventas",
            telefono = $"300{timestamp % 10_000_000:D7}",
            email = $"juan.rodriguez.{timestamp}@empresa.co"
        };

        // WHEN: POST /api/v1/contactos
        var createResponse = await _client.PostAsJsonAsync("/api/v1/contactos", payload);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var created = await createResponse.Content.ReadFromJsonAsync<ContactoResponse>();
        Assert.NotNull(created);

        try
        {
            // WHEN: GET /api/v1/contactos (re-GET)
            var listResponse = await _client.GetAsync("/api/v1/contactos");
            Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);

            // THEN: The created record appears in the list
            var body = await listResponse.Content.ReadFromJsonAsync<List<ContactoResponse>>();
            Assert.NotNull(body);

            Assert.True(
                body.Any(c => c.Id == created!.Id && c.Nombre == payload.nombre),
                $"Expected to find contacto with Id='{created!.Id}' and Nombre='{payload.nombre}' in GET response."
            );
        }
        finally
        {
            // Cleanup: Delete seeded contact
            await _client.DeleteAsync($"/api/v1/contactos/{created!.Id}");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-1-API-3 (P2) — contactos table has nullable cliente_id column
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-1-API-3 (P2)
    /// GIVEN the contactos table exists with ContactoConfiguration applied
    /// WHEN information_schema.columns is queried for contactos.cliente_id
    /// THEN the column exists and is nullable (is_nullable = 'YES')
    /// AND the index ix_contactos_cliente_id exists
    /// AND the index ix_contactos_email exists
    /// </summary>
    [Fact]
    public async Task ContactosTable_WhenMigrationApplied_HasNullableClienteIdColumnAndIndexes()
    {
        // GIVEN: Migration is applied and contactos table exists
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.MigrateAsync();

        var connection = dbContext.Database.GetDbConnection();
        await connection.OpenAsync();

        try
        {
            // WHEN: information_schema.columns is queried for cliente_id nullability
            using var nullabilityCmd = connection.CreateCommand();
            nullabilityCmd.CommandText = @"
                SELECT is_nullable
                FROM information_schema.columns
                WHERE table_name = 'contactos'
                  AND column_name = 'cliente_id';
            ";
            var isNullable = (string?)await nullabilityCmd.ExecuteScalarAsync();

            // THEN: cliente_id column exists and is nullable
            Assert.True(
                isNullable == "YES",
                "The 'cliente_id' column in 'contactos' table must be nullable (is_nullable = 'YES'). " +
                "Set ClienteId as Guid? with IsRequired(false) in ContactoConfiguration."
            );

            // WHEN: pg_indexes queried for ix_contactos_cliente_id
            using var idxClienteCmd = connection.CreateCommand();
            idxClienteCmd.CommandText = @"
                SELECT indexname
                FROM pg_indexes
                WHERE tablename = 'contactos'
                  AND indexname = 'ix_contactos_cliente_id';
            ";
            var idxCliente = (string?)await idxClienteCmd.ExecuteScalarAsync();

            // THEN: ix_contactos_cliente_id index exists
            Assert.True(
                idxCliente == "ix_contactos_cliente_id",
                "The 'ix_contactos_cliente_id' index must exist on the contactos table."
            );

            // WHEN: pg_indexes queried for ix_contactos_email
            using var idxEmailCmd = connection.CreateCommand();
            idxEmailCmd.CommandText = @"
                SELECT indexname
                FROM pg_indexes
                WHERE tablename = 'contactos'
                  AND indexname = 'ix_contactos_email';
            ";
            var idxEmail = (string?)await idxEmailCmd.ExecuteScalarAsync();

            // THEN: ix_contactos_email index exists
            Assert.True(
                idxEmail == "ix_contactos_email",
                "The 'ix_contactos_email' index must exist on the contactos table."
            );
        }
        finally
        {
            await connection.CloseAsync();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Response DTO (matches GET /api/v1/contactos JSON shape)
    // ─────────────────────────────────────────────────────────────────────────

    private sealed record ContactoResponse(
        Guid Id,
        string Nombre,
        string Cargo,
        string Telefono,
        string Email,
        Guid? ClienteId,
        DateTimeOffset CreatedAt,
        DateTimeOffset UpdatedAt
    );
}
