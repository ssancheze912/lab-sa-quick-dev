using System.Net;
using System.Net.Http.Json;
using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.IntegrationTests.Clientes;

/// <summary>
/// Story 2.5 (Epic 2: Client Management), AC #2 — ATDD Acceptance Tests, RED phase.
///
/// RED phase: fails to compile/run today because <c>DELETE /api/v1/clientes/{id:guid}</c>
/// (<c>ClienteEndpoints.MapClienteEndpoints</c>), <c>DeleteClienteCommandHandler</c> and
/// <c>IClienteRepository.DeleteAsync</c> do not exist yet (Story 2.5 Tasks 1-2).
///
/// Deliberately a NEW file rather than another section appended to
/// <c>ClienteEndpointsTests.cs</c> (523 lines) — already over the project's 500-line
/// test-file guideline flagged in Story 2.3's code review and the reason
/// <c>ClienteEndpointsUpdateTests.cs</c> was split out in Story 2.4. This class inherits the
/// shared <see cref="ClienteEndpointsTestBase"/> (Client, UniqueNit(), SeedClientesAsync,
/// DeleteClientesAsync, GetClientesAsync, ClienteApiResponse) with zero new duplication.
///
/// Covers `test-design-epic-2.md`'s TC-E2-P0-05 (Cliente-only portion — see Story 2.5 AC #4
/// scope note: the contacts-cascade portion is out of scope, `Contacto` doesn't exist yet).
/// </summary>
public class ClienteEndpointsDeleteTests : ClienteEndpointsTestBase
{
    public ClienteEndpointsDeleteTests(TestWebApplicationFactory factory) : base(factory)
    {
    }

    [RequiresPostgresFact]
    public async Task DeleteCliente_ReturnsNoContent_WhenClienteExists()
    {
        // GIVEN an existing client seeded directly via AppDbContext
        var existing = ClienteEntity.Create("Acme Corp", UniqueNit(), "3001234567", "Bogotá");
        await SeedClientesAsync(existing);

        // WHEN DELETE /api/v1/clientes/{id} is called
        var response = await Client.DeleteAsync($"/api/v1/clientes/{existing.Id}");

        // THEN the response status is 204 No Content (AC #2, architecture.md's DELETE format)
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [RequiresPostgresFact]
    public async Task DeleteCliente_RemovesFromDatabase()
    {
        // GIVEN an existing client seeded directly via AppDbContext
        var existing = ClienteEntity.Create("Acme Corp", UniqueNit(), "3001234567", "Bogotá");
        await SeedClientesAsync(existing);

        // WHEN DELETE /api/v1/clientes/{id} is called, then GET /api/v1/clientes/{id} for the same Id
        await Client.DeleteAsync($"/api/v1/clientes/{existing.Id}");
        var getResponse = await Client.GetAsync($"/api/v1/clientes/{existing.Id}");

        // THEN the client is genuinely gone from the database, not just hidden in the response
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    [RequiresPostgresFact]
    public async Task DeleteCliente_ReturnsNotFound_WhenClienteDoesNotExist()
    {
        // GIVEN a well-formed Id that does not correspond to any seeded client
        var nonExistentId = Guid.NewGuid();

        // WHEN DELETE /api/v1/clientes/{id} is called
        var response = await Client.DeleteAsync($"/api/v1/clientes/{nonExistentId}");

        // THEN the response status is 404 Not Found (already-deleted / stale client, e.g. a
        // second browser tab)
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [RequiresPostgresFact]
    public async Task DeleteCliente_DoesNotAffectOtherClientes()
    {
        // GIVEN two seeded clients
        var toDelete = ClienteEntity.Create("Acme Corp", UniqueNit(), "3001234567", "Bogotá");
        var untouched = ClienteEntity.Create("Beta SAS", UniqueNit(), "3019876543", "Medellín");
        await SeedClientesAsync(toDelete, untouched);

        try
        {
            // WHEN DELETE /api/v1/clientes/{id} is called for only the first client
            await Client.DeleteAsync($"/api/v1/clientes/{toDelete.Id}");
            var clientes = await GetClientesAsync();

            // THEN the second client still appears in the list, completely unaffected
            Assert.Contains(clientes, c => c.Id == untouched.Id);
        }
        finally
        {
            await DeleteClientesAsync(untouched.Id);
        }
    }
}
