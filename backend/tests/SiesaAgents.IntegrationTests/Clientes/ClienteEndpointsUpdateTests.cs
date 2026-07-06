using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.IntegrationTests.Clientes;

/// <summary>
/// Story 2.4 (Epic 2: Client Management), AC #2, #3 — ATDD Acceptance Tests, RED phase.
///
/// RED phase: fails to compile today for two independent reasons, both intentional:
///   1. <c>PUT /api/v1/clientes/{id:guid}</c> (<c>ClienteEndpoints.MapClienteEndpoints</c>),
///      <c>UpdateClienteCommandHandler</c> and <c>UpdateClienteRequest</c> do not exist yet
///      (Story 2.4 Task 2).
///   2. This class inherits <c>ClienteEndpointsTestBase</c>, which does not exist yet either —
///      Story 2.4 Task 3 extracts it from the duplicated helpers currently living in
///      <see cref="ClienteEndpointsTests"/>/<see cref="ClienteEndpointsEdgeCasesTests"/>
///      (flagged as Medium test-infrastructure debt in Story 2.3's code review).
///
/// Deliberately a NEW file rather than another section appended to
/// <c>ClienteEndpointsTests.cs</c> (584 lines) or <c>ClienteEndpointsEdgeCasesTests.cs</c>
/// (508 lines) — both already exceed the project's 500-line test-file guideline per that same
/// review. Once Task 3 creates <c>ClienteEndpointsTestBase</c> (exposing the shared
/// <c>Client</c>/<c>UniqueNit()</c>/<c>SeedClientesAsync</c>/<c>DeleteClientesAsync</c>/
/// <c>ClienteApiResponse</c> members those two files currently duplicate), this class compiles
/// against it with zero new duplication, and the two large files shrink instead of growing a
/// third time.
/// </summary>
public class ClienteEndpointsUpdateTests : ClienteEndpointsTestBase
{
    public ClienteEndpointsUpdateTests(TestWebApplicationFactory factory) : base(factory)
    {
    }

    [RequiresPostgresFact]
    public async Task UpdateCliente_ReturnsOk_WithValidData()
    {
        // GIVEN an existing client seeded directly via AppDbContext
        var existing = ClienteEntity.Create("Acme Corp", UniqueNit(), "3001234567", "Bogotá");
        await SeedClientesAsync(existing);
        var request = new UpdateClienteApiRequest("Acme Corp Updated", existing.Nit, "3009999999", "Cali");

        try
        {
            // WHEN PUT /api/v1/clientes/{id} is called with valid data
            var response = await Client.PutAsJsonAsync($"/api/v1/clientes/{existing.Id}", request);

            // THEN the response status is 200 OK (AC #2)
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }
        finally
        {
            await DeleteClientesAsync(existing.Id);
        }
    }

    [RequiresPostgresFact]
    public async Task UpdateCliente_ReturnsUpdatedCliente_WithValidData()
    {
        // GIVEN an existing client seeded directly via AppDbContext
        var existing = ClienteEntity.Create("Acme Corp", UniqueNit(), "3001234567", "Bogotá");
        await SeedClientesAsync(existing);
        var request = new UpdateClienteApiRequest("Acme Corp Updated", existing.Nit, "3009999999", "Cali");

        try
        {
            // WHEN PUT /api/v1/clientes/{id} is called with valid data
            var response = await Client.PutAsJsonAsync($"/api/v1/clientes/{existing.Id}", request);
            var updated = await response.Content.ReadFromJsonAsync<ClienteApiResponse>(
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            // THEN the response body reflects the new field values, while Id and CreatedAt
            // remain unchanged from the seeded original (AC #2 — Id/CreatedAt are never
            // touched by Update, per ClienteEntity.Update's contract). CreatedAt is compared
            // with a small tolerance, not exact equality, since PostgreSQL's `timestamptz`
            // column stores microsecond precision while .NET's DateTimeOffset ticks carry
            // 100ns precision — the same round-trip caveat already documented on
            // `GetClienteById_ReturnsCorrectDto_WhenClienteExists` in ClienteEndpointsTests.
            Assert.NotNull(updated);
            Assert.Equal(existing.Id, updated!.Id);
            Assert.Equal("Acme Corp Updated", updated.Nombre);
            Assert.Equal("3009999999", updated.Telefono);
            Assert.Equal("Cali", updated.Ciudad);
            Assert.True(
                (existing.CreatedAt - updated.CreatedAt).Duration() < TimeSpan.FromMilliseconds(1),
                $"Expected CreatedAt to be preserved (within 1ms), but was {existing.CreatedAt} vs {updated.CreatedAt}.");
        }
        finally
        {
            await DeleteClientesAsync(existing.Id);
        }
    }

    [RequiresPostgresFact]
    public async Task UpdateCliente_PersistsChanges()
    {
        // GIVEN an existing client seeded directly via AppDbContext
        var existing = ClienteEntity.Create("Acme Corp", UniqueNit(), "3001234567", "Bogotá");
        await SeedClientesAsync(existing);
        var request = new UpdateClienteApiRequest("Acme Corp Updated", existing.Nit, "3009999999", "Cali");

        try
        {
            // WHEN PUT /api/v1/clientes/{id} is called, then GET /api/v1/clientes/{id} for the same Id
            await Client.PutAsJsonAsync($"/api/v1/clientes/{existing.Id}", request);
            var getResponse = await Client.GetAsync($"/api/v1/clientes/{existing.Id}");
            var persisted = await getResponse.Content.ReadFromJsonAsync<ClienteApiResponse>(
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            // THEN the change is genuinely persisted, not just echoed in the PUT response
            Assert.NotNull(persisted);
            Assert.Equal("Acme Corp Updated", persisted!.Nombre);
            Assert.Equal("Cali", persisted.Ciudad);
        }
        finally
        {
            await DeleteClientesAsync(existing.Id);
        }
    }

    [RequiresPostgresFact]
    public async Task UpdateCliente_ReturnsNotFound_WhenClienteDoesNotExist()
    {
        // GIVEN a well-formed Id that does not correspond to any seeded client
        var nonExistentId = Guid.NewGuid();
        var request = new UpdateClienteApiRequest("Acme Corp", UniqueNit(), "3001234567", "Bogotá");

        // WHEN PUT /api/v1/clientes/{id} is called
        var response = await Client.PutAsJsonAsync($"/api/v1/clientes/{nonExistentId}", request);

        // THEN the response status is 404 Not Found
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [RequiresPostgresFact]
    public async Task UpdateCliente_MissingRequiredFields_Returns400()
    {
        // GIVEN an existing client and a request with an empty Nombre
        var existing = ClienteEntity.Create("Acme Corp", UniqueNit(), "3001234567", "Bogotá");
        await SeedClientesAsync(existing);
        var request = new UpdateClienteApiRequest("", existing.Nit, "3009999999", "Cali");

        try
        {
            // WHEN PUT /api/v1/clientes/{id} is called
            var response = await Client.PutAsJsonAsync($"/api/v1/clientes/{existing.Id}", request);

            // THEN the response is 400 Bad Request (AC #3's server-side defense-in-depth)
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }
        finally
        {
            await DeleteClientesAsync(existing.Id);
        }
    }

    [RequiresPostgresFact]
    public async Task UpdateCliente_MissingRequiredFields_LeavesOriginalRecordUnchanged()
    {
        // GIVEN an existing client and a request with an empty Nombre
        var existing = ClienteEntity.Create("Acme Corp", UniqueNit(), "3001234567", "Bogotá");
        await SeedClientesAsync(existing);
        var request = new UpdateClienteApiRequest("", existing.Nit, "3009999999", "Cali");

        try
        {
            // WHEN PUT /api/v1/clientes/{id} is called with an invalid request
            await Client.PutAsJsonAsync($"/api/v1/clientes/{existing.Id}", request);
            var getResponse = await Client.GetAsync($"/api/v1/clientes/{existing.Id}");
            var unchanged = await getResponse.Content.ReadFromJsonAsync<ClienteApiResponse>(
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            // THEN the original record is left completely unchanged (AC #3)
            Assert.NotNull(unchanged);
            Assert.Equal("Acme Corp", unchanged!.Nombre);
            Assert.Equal("Bogotá", unchanged.Ciudad);
        }
        finally
        {
            await DeleteClientesAsync(existing.Id);
        }
    }

    [RequiresPostgresFact]
    public async Task UpdateCliente_DuplicateNit_Returns409()
    {
        // GIVEN two seeded clients, and a PUT that edits the second one's NIT to match the first's
        var firstNit = UniqueNit();
        var first = ClienteEntity.Create("Acme Corp", firstNit, "3001234567", "Bogotá");
        var second = ClienteEntity.Create("Beta SAS", UniqueNit(), "3019876543", "Medellín");
        await SeedClientesAsync(first, second);
        var request = new UpdateClienteApiRequest("Beta SAS", firstNit, "3019876543", "Medellín");

        try
        {
            // WHEN PUT /api/v1/clientes/{second.Id} is called with the first client's NIT
            var response = await Client.PutAsJsonAsync($"/api/v1/clientes/{second.Id}", request);

            // THEN the response is 409 Conflict — the DB-level uk_clientes_nit constraint is
            // the source of truth, identical UX to the create-duplicate-NIT path
            Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        }
        finally
        {
            await DeleteClientesAsync(first.Id, second.Id);
        }
    }

    [RequiresPostgresFact]
    public async Task UpdateCliente_DuplicateNit_DoesNotChangeSecondClientsNitInDb()
    {
        // GIVEN two seeded clients, and a PUT that edits the second one's NIT to match the first's
        var firstNit = UniqueNit();
        var secondNit = UniqueNit();
        var first = ClienteEntity.Create("Acme Corp", firstNit, "3001234567", "Bogotá");
        var second = ClienteEntity.Create("Beta SAS", secondNit, "3019876543", "Medellín");
        await SeedClientesAsync(first, second);
        var request = new UpdateClienteApiRequest("Beta SAS", firstNit, "3019876543", "Medellín");

        try
        {
            // WHEN PUT /api/v1/clientes/{second.Id} is called with the first client's NIT
            await Client.PutAsJsonAsync($"/api/v1/clientes/{second.Id}", request);
            var getResponse = await Client.GetAsync($"/api/v1/clientes/{second.Id}");
            var secondAfter = await getResponse.Content.ReadFromJsonAsync<ClienteApiResponse>(
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            // THEN the second client's NIT in the DB is unchanged — no leak of a
            // partially-applied update (mirrors CreateCliente_DuplicateNit's no-leak style)
            Assert.NotNull(secondAfter);
            Assert.Equal(secondNit, secondAfter!.Nit);
        }
        finally
        {
            await DeleteClientesAsync(first.Id, second.Id);
        }
    }

    private sealed record UpdateClienteApiRequest(string Nombre, string Nit, string Telefono, string Ciudad);
}
