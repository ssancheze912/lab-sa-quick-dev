using System.Net;
using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.IntegrationTests.Clientes;

/// <summary>
/// Story 2.5 (Epic 2: Client Management) — Test Automation Expansion (testarch-automate).
///
/// Expands beyond the ATDD-authored <see cref="ClienteEndpointsDeleteTests"/> with edge cases,
/// boundary conditions and error paths not covered by the story's three acceptance criteria,
/// mirroring the same expansion pattern <see cref="ClienteEndpointsUpdateEdgeCasesTests"/>
/// applied to the PUT endpoint (malformed/empty/uppercase Guid route boundaries) plus a
/// delete-specific idempotency case (second delete of an already-deleted id). Deliberately a
/// new file rather than growing <see cref="ClienteEndpointsDeleteTests"/> further, following
/// the same "keep test files lean" rationale already applied across this suite.
/// </summary>
public class ClienteEndpointsDeleteEdgeCasesTests : ClienteEndpointsTestBase
{
    public ClienteEndpointsDeleteEdgeCasesTests(TestWebApplicationFactory factory) : base(factory)
    {
    }

    // ── Route/Id boundary conditions (mirrors UpdateCliente's coverage in its EdgeCasesTests) ─

    [RequiresPostgresFact]
    public async Task DeleteCliente_ReturnsNotFound_WhenIdIsMalformedGuid()
    {
        // GIVEN a path segment that is not a valid GUID
        const string malformedId = "not-a-valid-guid";

        // WHEN DELETE /api/v1/clientes/{id} is called with the malformed segment
        var response = await Client.DeleteAsync($"/api/v1/clientes/{malformedId}");

        // THEN the request falls through to ASP.NET's default 404 (the `:guid` route
        // constraint simply doesn't match, same behavior already proven for GET/PUT)
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [RequiresPostgresFact]
    public async Task DeleteCliente_ReturnsNotFound_WhenIdIsEmptyGuid()
    {
        // GIVEN Guid.Empty, a well-formed but degenerate Id never assigned to a real client
        var emptyId = Guid.Empty;

        // WHEN DELETE /api/v1/clientes/{id} is called with Guid.Empty
        var response = await Client.DeleteAsync($"/api/v1/clientes/{emptyId}");

        // THEN it is treated like any other well-formed-but-missing Id — 404, not a crash
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [RequiresPostgresFact]
    public async Task DeleteCliente_ReturnsNoContent_WhenIdIsUppercaseGuid()
    {
        // GIVEN a client seeded directly via AppDbContext
        var existing = ClienteEntity.Create("Acme Corp", UniqueNit(), "3001234567", "Bogotá");
        await SeedClientesAsync(existing);

        try
        {
            // WHEN DELETE /api/v1/clientes/{id} is called with the Id formatted in uppercase
            var uppercaseId = existing.Id.ToString().ToUpperInvariant();
            var response = await Client.DeleteAsync($"/api/v1/clientes/{uppercaseId}");

            // THEN the request still resolves to 204 No Content — case must not affect route
            // matching
            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        }
        finally
        {
            await DeleteClientesAsync(existing.Id);
        }
    }

    // ── Idempotency: deleting an already-deleted id (e.g. a second browser tab / double call) ─

    [RequiresPostgresFact]
    public async Task DeleteCliente_ReturnsNotFound_WhenCalledTwiceForSameId()
    {
        // GIVEN an existing client that has already been deleted once
        var existing = ClienteEntity.Create("Acme Corp", UniqueNit(), "3001234567", "Bogotá");
        await SeedClientesAsync(existing);
        var firstResponse = await Client.DeleteAsync($"/api/v1/clientes/{existing.Id}");
        Assert.Equal(HttpStatusCode.NoContent, firstResponse.StatusCode);

        // WHEN DELETE /api/v1/clientes/{id} is called a second time for the same id
        var secondResponse = await Client.DeleteAsync($"/api/v1/clientes/{existing.Id}");

        // THEN the second call reports 404 (not-found), never a 500 or a repeated 204 — the
        // handler's binary contract (found-and-deleted vs. not-found) holds on repeat calls
        Assert.Equal(HttpStatusCode.NotFound, secondResponse.StatusCode);
    }
}
