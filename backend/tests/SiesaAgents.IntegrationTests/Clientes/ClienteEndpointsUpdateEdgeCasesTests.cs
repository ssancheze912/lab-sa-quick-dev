using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.IntegrationTests.Clientes;

/// <summary>
/// Story 2.4 (Epic 2: Client Management) — Test Automation Expansion (testarch-automate).
///
/// Expands beyond the ATDD-authored <see cref="ClienteEndpointsUpdateTests"/> with edge cases,
/// boundary conditions and error paths not covered by the story's four acceptance criteria,
/// mirroring the same expansion pattern <c>ClienteEndpointsEdgeCasesTests.cs</c> applied to the
/// GET/POST endpoints (malformed/empty/uppercase Guids, script/SQL-injection payloads,
/// MaximumLength boundaries). Deliberately a new file rather than growing
/// <see cref="ClienteEndpointsUpdateTests"/> further, following the same "keep test files lean"
/// rationale Task 3 already applied to this suite.
/// </summary>
public class ClienteEndpointsUpdateEdgeCasesTests : ClienteEndpointsTestBase
{
    public ClienteEndpointsUpdateEdgeCasesTests(TestWebApplicationFactory factory) : base(factory)
    {
    }

    // ── Self-NIT regression guard (P0) ──────────────────────────────────────────────────────
    // The most common real-world PUT payload resubmits the client's OWN unchanged NIT (AC #2
    // requires the full current form values to be sent, not just the changed field). This must
    // never be mistaken for a duplicate-NIT conflict against itself.

    [RequiresPostgresFact]
    public async Task UpdateCliente_ReturnsOk_WhenNitIsUnchanged()
    {
        // GIVEN an existing client and an update request that only changes Ciudad, resending
        // the client's own current NIT unchanged (the normal ClienteForm submission shape)
        var existing = ClienteEntity.Create("Acme Corp", UniqueNit(), "3001234567", "Bogotá");
        await SeedClientesAsync(existing);
        var request = new UpdateClienteApiRequest("Acme Corp", existing.Nit, "3001234567", "Medellín");

        try
        {
            // WHEN PUT /api/v1/clientes/{id} is called with the client's own unchanged NIT
            var response = await Client.PutAsJsonAsync($"/api/v1/clientes/{existing.Id}", request);

            // THEN the update succeeds — a row updating its own NIT is never a uk_clientes_nit
            // violation against itself
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }
        finally
        {
            await DeleteClientesAsync(existing.Id);
        }
    }

    [RequiresPostgresFact]
    public async Task UpdateCliente_PersistsCiudadChange_WhenNitIsResubmittedUnchanged()
    {
        // GIVEN an existing client and an update that resends its own unchanged NIT
        var existing = ClienteEntity.Create("Acme Corp", UniqueNit(), "3001234567", "Bogotá");
        await SeedClientesAsync(existing);
        var request = new UpdateClienteApiRequest("Acme Corp", existing.Nit, "3001234567", "Medellín");

        try
        {
            // WHEN PUT /api/v1/clientes/{id} is called, then the record is re-fetched
            await Client.PutAsJsonAsync($"/api/v1/clientes/{existing.Id}", request);
            var getResponse = await Client.GetAsync($"/api/v1/clientes/{existing.Id}");
            var persisted = await getResponse.Content.ReadFromJsonAsync<ClienteApiResponse>(
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            // THEN the Ciudad change is genuinely persisted — the self-NIT resubmission did
            // not silently no-op the whole update
            Assert.NotNull(persisted);
            Assert.Equal("Medellín", persisted!.Ciudad);
        }
        finally
        {
            await DeleteClientesAsync(existing.Id);
        }
    }

    // ── Route/Id boundary conditions (mirrors GetClienteById's coverage in EdgeCasesTests) ──

    [RequiresPostgresFact]
    public async Task UpdateCliente_ReturnsNotFound_WhenIdIsMalformedGuid()
    {
        // GIVEN a path segment that is not a valid GUID
        const string malformedId = "not-a-valid-guid";
        var request = new UpdateClienteApiRequest("Acme Corp", UniqueNit(), "3001234567", "Bogotá");

        // WHEN PUT /api/v1/clientes/{id} is called with the malformed segment
        var response = await Client.PutAsJsonAsync($"/api/v1/clientes/{malformedId}", request);

        // THEN the request falls through to ASP.NET's default 404 (the `:guid` route
        // constraint simply doesn't match, same behavior already proven for GET)
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [RequiresPostgresFact]
    public async Task UpdateCliente_ReturnsNotFound_WhenIdIsEmptyGuid()
    {
        // GIVEN Guid.Empty, a well-formed but degenerate Id never assigned to a real client
        var emptyId = Guid.Empty;
        var request = new UpdateClienteApiRequest("Acme Corp", UniqueNit(), "3001234567", "Bogotá");

        // WHEN PUT /api/v1/clientes/{id} is called with Guid.Empty
        var response = await Client.PutAsJsonAsync($"/api/v1/clientes/{emptyId}", request);

        // THEN it is treated like any other well-formed-but-missing Id — 404, not a crash
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [RequiresPostgresFact]
    public async Task UpdateCliente_ReturnsOk_WhenIdIsUppercaseGuid()
    {
        // GIVEN a client seeded directly via AppDbContext
        var existing = ClienteEntity.Create("Acme Corp", UniqueNit(), "3001234567", "Bogotá");
        await SeedClientesAsync(existing);
        var request = new UpdateClienteApiRequest("Acme Corp Updated", existing.Nit, "3001234567", "Cali");

        try
        {
            // WHEN PUT /api/v1/clientes/{id} is called with the Id formatted in uppercase
            var uppercaseId = existing.Id.ToString().ToUpperInvariant();
            var response = await Client.PutAsJsonAsync($"/api/v1/clientes/{uppercaseId}", request);

            // THEN the request still resolves to 200 OK — case must not affect route matching
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }
        finally
        {
            await DeleteClientesAsync(existing.Id);
        }
    }

    // ── Whitespace-only field (distinct from the ATDD suite's empty-string case) ────────────

    [RequiresPostgresFact]
    public async Task UpdateCliente_WhitespaceOnlyNombre_Returns400()
    {
        // GIVEN an existing client and a request whose Nombre is whitespace-only (not merely
        // empty — proves the server-side `NotEmpty()` guard, which treats whitespace-only as
        // empty, catches this distinct input shape too)
        var existing = ClienteEntity.Create("Acme Corp", UniqueNit(), "3001234567", "Bogotá");
        await SeedClientesAsync(existing);
        var request = new UpdateClienteApiRequest("   ", existing.Nit, "3009999999", "Cali");

        try
        {
            // WHEN PUT /api/v1/clientes/{id} is called
            var response = await Client.PutAsJsonAsync($"/api/v1/clientes/{existing.Id}", request);

            // THEN the response is 400 Bad Request, same as an empty string
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }
        finally
        {
            await DeleteClientesAsync(existing.Id);
        }
    }

    // ── MaximumLength boundary (mirrors CreateCliente_NombreAtMaxLength/ExceedsMaxLength) ───

    [RequiresPostgresFact]
    public async Task UpdateCliente_NombreAtMaxLength_ReturnsOk()
    {
        // GIVEN a Nombre exactly at the 200-character validator/DB column boundary
        var existing = ClienteEntity.Create("Acme Corp", UniqueNit(), "3001234567", "Bogotá");
        await SeedClientesAsync(existing);
        var nombreAtMaxLength = new string('A', 200);
        var request = new UpdateClienteApiRequest(nombreAtMaxLength, existing.Nit, "3001234567", "Bogotá");

        try
        {
            // WHEN PUT /api/v1/clientes/{id} is called
            var response = await Client.PutAsJsonAsync($"/api/v1/clientes/{existing.Id}", request);

            // THEN the boundary value is accepted
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }
        finally
        {
            await DeleteClientesAsync(existing.Id);
        }
    }

    [RequiresPostgresFact]
    public async Task UpdateCliente_NombreExceedsMaxLength_LeavesOriginalRecordUnchanged()
    {
        // GIVEN a Nombre one character past the 200-character boundary
        var existing = ClienteEntity.Create("Acme Corp", UniqueNit(), "3001234567", "Bogotá");
        await SeedClientesAsync(existing);
        var nombreExceedingMaxLength = new string('A', 201);
        var request = new UpdateClienteApiRequest(nombreExceedingMaxLength, existing.Nit, "3009999999", "Cali");

        try
        {
            // WHEN PUT /api/v1/clientes/{id} is called
            var response = await Client.PutAsJsonAsync($"/api/v1/clientes/{existing.Id}", request);
            var getResponse = await Client.GetAsync($"/api/v1/clientes/{existing.Id}");
            var unchanged = await getResponse.Content.ReadFromJsonAsync<ClienteApiResponse>(
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            // THEN the request is rejected (400, validator boundary) and the original record
            // is left completely unchanged — a rejected update never partially applies
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.NotNull(unchanged);
            Assert.Equal("Acme Corp", unchanged!.Nombre);
        }
        finally
        {
            await DeleteClientesAsync(existing.Id);
        }
    }

    // ── Script/SQL-injection payload safety (mirrors CreateCliente's NFR5 coverage) ─────────

    [RequiresPostgresFact]
    public async Task UpdateCliente_WithScriptTagInNombre_PersistsAsPlainText()
    {
        // GIVEN an existing client and an update whose Nombre contains a script-injection
        // payload
        var existing = ClienteEntity.Create("Acme Corp", UniqueNit(), "3001234567", "Bogotá");
        await SeedClientesAsync(existing);
        var request = new UpdateClienteApiRequest(
            "<script>alert(1)</script>", existing.Nit, "3001234567", "Bogotá");

        try
        {
            // WHEN PUT /api/v1/clientes/{id} is called
            var response = await Client.PutAsJsonAsync($"/api/v1/clientes/{existing.Id}", request);
            var updated = await response.Content.ReadFromJsonAsync<ClienteApiResponse>(
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            // THEN the payload is treated as ordinary text and the update succeeds (NFR5) —
            // it is not rejected, sanitized-away, or does it crash the server
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.Equal("<script>alert(1)</script>", updated!.Nombre);
        }
        finally
        {
            await DeleteClientesAsync(existing.Id);
        }
    }

    private sealed record UpdateClienteApiRequest(string Nombre, string Nit, string Telefono, string Ciudad);
}
