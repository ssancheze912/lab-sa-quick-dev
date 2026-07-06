using System.Net;
using System.Net.Http.Json;
using System.Net.Mime;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests.Clientes;

/// <summary>
/// Story 2.1 (Epic 2: Client Management) — Automation Expansion (testarch-automate).
///
/// Edge cases NOT covered by the ATDD RED-phase suite (<see cref="ClienteEndpointsTests"/>):
/// response Content-Type, full-field round-trip (Telefono/Ciudad were seeded but never
/// asserted), Unicode/special-character preservation (accents, ñ, apostrophes), and a
/// larger record count sanity check. Same seed-via-<c>AppDbContext</c> approach as the ATDD
/// suite (Story 2.1 Dev Notes — POST is out of scope until Story 2.3), same
/// <see cref="RequiresPostgresFactAttribute"/> soft-skip convention.
/// </summary>
public class ClienteEndpointsEdgeCasesTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public ClienteEndpointsEdgeCasesTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [RequiresPostgresFact]
    public async Task GetClientes_ReturnsJsonContentType()
    {
        // GIVEN the clientes table has no rows
        await ClearClientesTableAsync();

        // WHEN GET /api/v1/clientes is called
        var response = await _client.GetAsync("/api/v1/clientes");

        // THEN the response declares a JSON content type
        Assert.NotNull(response.Content.Headers.ContentType);
        Assert.Equal(MediaTypeNames.Application.Json, response.Content.Headers.ContentType!.MediaType);
    }

    [RequiresPostgresFact]
    public async Task GetClientes_ReturnsTelefonoAndCiudad_WhenDataExists()
    {
        // GIVEN a client seeded with known Telefono/Ciudad values, directly via AppDbContext
        var cliente = ClienteEntity.Create("Acme Corp", UniqueNit(), "3005551234", "Cartagena");
        await SeedClientesAsync(cliente);

        try
        {
            // WHEN GET /api/v1/clientes is called
            var clientes = await GetClientesAsync();

            // THEN the full record round-trips correctly, including fields the ATDD suite
            // did not assert on (Telefono, Ciudad)
            var found = Assert.Single(clientes, c => c.Id == cliente.Id);
            Assert.Equal("3005551234", found.Telefono);
            Assert.Equal("Cartagena", found.Ciudad);
        }
        finally
        {
            await DeleteClientesAsync(cliente.Id);
        }
    }

    [RequiresPostgresFact]
    public async Task GetClientes_PreservesAccentsAndSpecialCharacters_InNombre()
    {
        // GIVEN a client with a Nombre containing Spanish accents, ñ, and an apostrophe
        const string nombreConCaracteresEspeciales = "Compañía Ñoño & O'Brien S.A.S.";
        var cliente = ClienteEntity.Create(
            nombreConCaracteresEspeciales, UniqueNit(), "3001234567", "Bogotá");
        await SeedClientesAsync(cliente);

        try
        {
            // WHEN GET /api/v1/clientes is called
            var clientes = await GetClientesAsync();

            // THEN the Nombre round-trips through PostgreSQL/JSON without corruption
            Assert.Contains(clientes, c => c.Nombre == nombreConCaracteresEspeciales);
        }
        finally
        {
            await DeleteClientesAsync(cliente.Id);
        }
    }

    [RequiresPostgresFact]
    public async Task GetClientes_ReturnsNonDefaultCreatedAt_WhenDataExists()
    {
        // GIVEN a client seeded directly via AppDbContext
        var cliente = ClienteEntity.Create("Acme Corp", UniqueNit(), "3001234567", "Bogotá");
        await SeedClientesAsync(cliente);

        try
        {
            // WHEN GET /api/v1/clientes is called
            var clientes = await GetClientesAsync();

            // THEN CreatedAt is present and deserializes to a real, non-default timestamp
            var found = Assert.Single(clientes, c => c.Id == cliente.Id);
            Assert.NotEqual(default, found.CreatedAt);
        }
        finally
        {
            await DeleteClientesAsync(cliente.Id);
        }
    }

    [RequiresPostgresFact]
    public async Task GetClientes_ReturnsAllSeededRecords_WhenMoreThanTwoExist()
    {
        // GIVEN ten clients seeded directly via AppDbContext (sanity check beyond the ATDD
        // suite's two-record case)
        var clientes = Enumerable.Range(1, 10)
            .Select(i => ClienteEntity.Create($"Cliente {i}", UniqueNit(), "3000000000", "Bogotá"))
            .ToArray();
        await SeedClientesAsync(clientes);

        try
        {
            // WHEN GET /api/v1/clientes is called
            var response = await GetClientesAsync();

            // THEN all ten seeded records are present in the response
            var seededIds = clientes.Select(c => c.Id).ToHashSet();
            var returnedIds = response.Select(c => c.Id).ToHashSet();
            Assert.True(seededIds.IsSubsetOf(returnedIds));
        }
        finally
        {
            await DeleteClientesAsync(clientes.Select(c => c.Id).ToArray());
        }
    }

    // ── Story 2.2 (AC #3) — ATDD Acceptance Tests, RED phase ──────────────────────────────
    // Proves the `:guid` route constraint documented in Story 2.2 Task 1: a malformed
    // (non-UUID) path segment never reaches `GetClienteByIdQueryHandler`, falling through to
    // ASP.NET's default 404 instead. This already returns 404 today (no route matches the
    // path at all pre-implementation) and continues to return 404 once the `{id:guid}` route
    // is mapped — this test guards that framework-level behavior stays true across the
    // implementation, complementing `ClienteEndpointsTests`'s well-formed-but-missing-Id case.

    [RequiresPostgresFact]
    public async Task GetClienteById_ReturnsNotFound_WhenIdIsMalformedGuid()
    {
        // GIVEN a path segment that is not a valid GUID
        const string malformedId = "not-a-valid-guid";

        // WHEN GET /api/v1/clientes/{id} is called with the malformed segment
        var response = await _client.GetAsync($"/api/v1/clientes/{malformedId}");

        // THEN the request falls through to ASP.NET's default 404 (AC #3)
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ── Test Automation Expansion (testarch-automate) — Story 2.2 edge cases beyond ATDD ────

    [RequiresPostgresFact]
    public async Task GetClienteById_ReturnsJsonContentType_WhenClienteExists()
    {
        // GIVEN a client seeded directly via AppDbContext
        var cliente = ClienteEntity.Create("Acme Corp", UniqueNit(), "3001234567", "Bogotá");
        await SeedClientesAsync(cliente);

        try
        {
            // WHEN GET /api/v1/clientes/{id} is called
            var response = await _client.GetAsync($"/api/v1/clientes/{cliente.Id}");

            // THEN the response declares a JSON content type (mirrors the list endpoint's
            // already-asserted convention, now verified for the single-record lookup too)
            Assert.NotNull(response.Content.Headers.ContentType);
            Assert.Equal(MediaTypeNames.Application.Json, response.Content.Headers.ContentType!.MediaType);
        }
        finally
        {
            await DeleteClientesAsync(cliente.Id);
        }
    }

    [RequiresPostgresFact]
    public async Task GetClienteById_PreservesAccentsAndSpecialCharacters_InNombre()
    {
        // GIVEN a client with a Nombre containing Spanish accents, ñ, and an apostrophe
        const string nombreConCaracteresEspeciales = "Compañía Ñoño & O'Brien S.A.S.";
        var cliente = ClienteEntity.Create(
            nombreConCaracteresEspeciales, UniqueNit(), "3001234567", "Bogotá");
        await SeedClientesAsync(cliente);

        try
        {
            // WHEN GET /api/v1/clientes/{id} is called with that client's Id
            var response = await _client.GetAsync($"/api/v1/clientes/{cliente.Id}");
            var json = await response.Content.ReadAsStringAsync();
            var found = JsonSerializer.Deserialize<ClienteApiResponse>(
                json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            // THEN the Nombre round-trips through PostgreSQL/JSON without corruption, same
            // as the list endpoint's already-asserted single-record guarantee
            Assert.NotNull(found);
            Assert.Equal(nombreConCaracteresEspeciales, found!.Nombre);
        }
        finally
        {
            await DeleteClientesAsync(cliente.Id);
        }
    }

    [RequiresPostgresFact]
    public async Task GetClienteById_ReturnsUppercaseGuid_AsOk()
    {
        // GIVEN a client seeded directly via AppDbContext
        var cliente = ClienteEntity.Create("Acme Corp", UniqueNit(), "3001234567", "Bogotá");
        await SeedClientesAsync(cliente);

        try
        {
            // WHEN GET /api/v1/clientes/{id} is called with the Id formatted in uppercase
            // (ASP.NET's `:guid` route constraint parses case-insensitively)
            var uppercaseId = cliente.Id.ToString().ToUpperInvariant();
            var response = await _client.GetAsync($"/api/v1/clientes/{uppercaseId}");

            // THEN the request still resolves to 200 OK — case must not affect route matching
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }
        finally
        {
            await DeleteClientesAsync(cliente.Id);
        }
    }

    [RequiresPostgresFact]
    public async Task GetClienteById_ReturnsOnlyTheRequestedRecord_WhenMultipleClientsExist()
    {
        // GIVEN two distinct clients seeded directly via AppDbContext
        var clienteA = ClienteEntity.Create("Acme Corp", UniqueNit(), "3001234567", "Bogotá");
        var clienteB = ClienteEntity.Create("Beta SAS", UniqueNit(), "3019876543", "Medellín");
        await SeedClientesAsync(clienteA, clienteB);

        try
        {
            // WHEN GET /api/v1/clientes/{id} is called with clienteA's Id
            var response = await _client.GetAsync($"/api/v1/clientes/{clienteA.Id}");
            var json = await response.Content.ReadAsStringAsync();
            var found = JsonSerializer.Deserialize<ClienteApiResponse>(
                json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            // THEN only clienteA's fields are returned — clienteB's data never leaks into
            // the single-record lookup, even though both rows exist in the table
            Assert.NotNull(found);
            Assert.Equal(clienteA.Id, found!.Id);
            Assert.Equal("Acme Corp", found.Nombre);
            Assert.NotEqual(clienteB.Id, found.Id);
        }
        finally
        {
            await DeleteClientesAsync(clienteA.Id, clienteB.Id);
        }
    }

    [RequiresPostgresFact]
    public async Task GetClienteById_ReturnsNotFound_WhenIdIsEmptyGuid()
    {
        // GIVEN Guid.Empty, a well-formed but degenerate Id that is never assigned to a
        // real client (ClienteEntity.Create always generates a fresh Guid.NewGuid())
        var emptyId = Guid.Empty;

        // WHEN GET /api/v1/clientes/{id} is called with Guid.Empty
        var response = await _client.GetAsync($"/api/v1/clientes/{emptyId}");

        // THEN it is treated like any other well-formed-but-missing Id — 404, not a crash
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ── Story 2.3 (AC #2) — ATDD Acceptance Tests, RED phase (TC-E2-P2-05, NFR5) ───────────
    // RED phase: fails to compile today because `POST /api/v1/clientes` doesn't exist yet
    // (Story 2.3 Task 1). Proves EF Core's parameterized queries make script/SQL-injection
    // payloads inert free text — they are legitimate input, not something FluentValidation's
    // `NotEmpty()` should reject.

    [RequiresPostgresFact]
    public async Task CreateCliente_WithScriptTagInNombre_ReturnsCreated()
    {
        // GIVEN a create request whose Nombre contains a script-injection payload
        var nit = UniqueNit();
        var request = new CreateClienteApiRequest("<script>alert(1)</script>", nit, "3001234567", "Bogotá");

        try
        {
            // WHEN POST /api/v1/clientes is called
            var response = await _client.PostAsJsonAsync("/api/v1/clientes", request);

            // THEN the payload is treated as ordinary text and the client is created (NFR5) —
            // it is not rejected, sanitized-away, or does it crash the server
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        }
        finally
        {
            await DeleteClienteByNitAsync(nit);
        }
    }

    [RequiresPostgresFact]
    public async Task CreateCliente_WithSqlInjectionAttemptInNombre_ReturnsCreated()
    {
        // GIVEN a create request whose Nombre contains a SQL-injection payload
        var nit = UniqueNit();
        var request = new CreateClienteApiRequest("'; DROP TABLE clientes;--", nit, "3001234567", "Bogotá");

        try
        {
            // WHEN POST /api/v1/clientes is called
            var response = await _client.PostAsJsonAsync("/api/v1/clientes", request);

            // THEN EF Core's parameterized queries make the value inert — the client is
            // created normally, the payload is stored as plain text (NFR5)
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        }
        finally
        {
            await DeleteClienteByNitAsync(nit);
        }
    }

    [RequiresPostgresFact]
    public async Task CreateCliente_WhitespaceOnlyNombre_Returns400()
    {
        // GIVEN a request whose Nombre is whitespace-only (distinct boundary from a fully
        // empty string — FluentValidation's NotEmpty() must reject both identically)
        var nit = UniqueNit();
        var request = new CreateClienteApiRequest("   ", nit, "3001234567", "Bogotá");

        // WHEN POST /api/v1/clientes is called
        var response = await _client.PostAsJsonAsync("/api/v1/clientes", request);

        // THEN the response is 400 Bad Request, same as a fully empty Nombre
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [RequiresPostgresFact]
    public async Task CreateCliente_ReturnsJsonContentType_WithValidData()
    {
        // GIVEN a well-formed create request with a fresh, never-used NIT
        var nit = UniqueNit();
        var request = new CreateClienteApiRequest("Acme Corp", nit, "3001234567", "Bogotá");

        try
        {
            // WHEN POST /api/v1/clientes is called
            var response = await _client.PostAsJsonAsync("/api/v1/clientes", request);

            // THEN the response declares a JSON content type, mirroring the GET endpoints'
            // already-asserted convention
            Assert.NotNull(response.Content.Headers.ContentType);
            Assert.Equal(MediaTypeNames.Application.Json, response.Content.Headers.ContentType!.MediaType);
        }
        finally
        {
            await DeleteClienteByNitAsync(nit);
        }
    }

    [RequiresPostgresFact]
    public async Task CreateCliente_NombreAtMaxLength_ReturnsCreated()
    {
        // GIVEN a Nombre exactly at the `ClienteConfiguration.HasMaxLength(200)` boundary
        var nit = UniqueNit();
        var nombreAtMaxLength = new string('A', 200);
        var request = new CreateClienteApiRequest(nombreAtMaxLength, nit, "3001234567", "Bogotá");

        try
        {
            // WHEN POST /api/v1/clientes is called
            var response = await _client.PostAsJsonAsync("/api/v1/clientes", request);

            // THEN the boundary value is accepted — 200 characters fits exactly in the column
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        }
        finally
        {
            await DeleteClienteByNitAsync(nit);
        }
    }

    [RequiresPostgresFact]
    public async Task CreateCliente_NombreExceedsMaxLength_DoesNotReturnSuccessOrLeakTechnicalDetail()
    {
        // GIVEN a Nombre one character past the `ClienteConfiguration.HasMaxLength(200)`
        // database column limit — `CreateClienteRequestValidator` now enforces a matching
        // `MaximumLength(200)` (code-review fix for the gap this test originally documented),
        // so this request is rejected with a clean 400 before ever reaching the database
        var nit = UniqueNit();
        var nombreExceedingMaxLength = new string('A', 201);
        var request = new CreateClienteApiRequest(nombreExceedingMaxLength, nit, "3001234567", "Bogotá");

        try
        {
            // WHEN POST /api/v1/clientes is called
            var response = await _client.PostAsJsonAsync("/api/v1/clientes", request);
            var body = await response.Content.ReadAsStringAsync();

            // THEN the request is not silently accepted as if it were valid data, and
            // regardless of the exact status code returned, no stack trace or exception
            // type is ever exposed to the client (NFR6) and nothing is persisted under
            // that NIT
            Assert.NotEqual(HttpStatusCode.Created, response.StatusCode);
            Assert.DoesNotContain("Npgsql", body);
            Assert.DoesNotContain("Exception", body);
            var clientes = await GetClientesAsync();
            Assert.DoesNotContain(clientes, c => c.Nit == nit);
        }
        finally
        {
            await DeleteClienteByNitAsync(nit);
        }
    }

    [RequiresPostgresFact]
    public async Task CreateCliente_WithSqlInjectionAttemptInNombre_DoesNotDropClientesTable()
    {
        // GIVEN a pre-existing client and a create request with a SQL-injection payload
        var preExisting = ClienteEntity.Create("Acme Corp", UniqueNit(), "3001234567", "Bogotá");
        await SeedClientesAsync(preExisting);
        var nit = UniqueNit();
        var request = new CreateClienteApiRequest("'; DROP TABLE clientes;--", nit, "3001234567", "Bogotá");

        try
        {
            // WHEN POST /api/v1/clientes is submitted with the malicious payload
            await _client.PostAsJsonAsync("/api/v1/clientes", request);
            var response = await _client.GetAsync("/api/v1/clientes");

            // THEN the clientes table still exists and the pre-existing record is intact —
            // no 500, no dropped table
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var clientes = await GetClientesAsync();
            Assert.Contains(clientes, c => c.Id == preExisting.Id);
        }
        finally
        {
            await DeleteClientesAsync(preExisting.Id);
            await DeleteClienteByNitAsync(nit);
        }
    }

    private static string UniqueNit() =>
        $"9{DateTimeOffset.UtcNow.Ticks % 100_000_000:D8}";

    private async Task DeleteClienteByNitAsync(string nit)
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var toRemove = await dbContext.Clientes.Where(c => c.Nit == nit).ToListAsync();
        dbContext.Clientes.RemoveRange(toRemove);
        await dbContext.SaveChangesAsync();
    }

    private sealed record CreateClienteApiRequest(string Nombre, string Nit, string Telefono, string Ciudad);

    private async Task SeedClientesAsync(params ClienteEntity[] clientes)
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        dbContext.Clientes.AddRange(clientes);
        await dbContext.SaveChangesAsync();
    }

    private async Task DeleteClientesAsync(params Guid[] ids)
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var toRemove = await dbContext.Clientes.Where(c => ids.Contains(c.Id)).ToListAsync();
        dbContext.Clientes.RemoveRange(toRemove);
        await dbContext.SaveChangesAsync();
    }

    private async Task ClearClientesTableAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.ExecuteSqlRawAsync("DELETE FROM clientes");
    }

    private async Task<List<ClienteApiResponse>> GetClientesAsync()
    {
        var response = await _client.GetAsync("/api/v1/clientes");
        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<List<ClienteApiResponse>>(
                   json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
               ?? [];
    }

    private sealed record ClienteApiResponse(
        Guid Id,
        string Nombre,
        string Nit,
        string Telefono,
        string Ciudad,
        DateTimeOffset CreatedAt);
}
