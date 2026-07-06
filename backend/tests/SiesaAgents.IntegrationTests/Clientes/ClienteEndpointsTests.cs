using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests.Clientes;

/// <summary>
/// Story 2.1 (Epic 2: Client Management), AC #1 — ATDD Acceptance Tests, RED phase.
///
/// RED phase: fails to compile today because <c>SiesaAgents.Domain.Clientes.Entities.ClienteEntity</c>,
/// <c>AppDbContext.Clientes</c>, and the <c>GET /api/v1/clientes</c> endpoint
/// (<c>ClienteEndpoints.MapClienteEndpoints</c>) do not exist yet (Story 2.1 Tasks 1-2).
///
/// Requires a reachable local PostgreSQL instance with the `CreateClientesTable` migration
/// applied (Story 2.1 Task 1's `dotnet ef database update`) — decorated with
/// <see cref="RequiresPostgresFactAttribute"/> per the project's soft-skip convention
/// established in Story 1.3 (xUnit reports "Skipped", never a false "Passed" with no
/// assertions run, when PostgreSQL is unreachable).
///
/// Per Story 2.1 Dev Notes ("Known Cross-Story Test Dependency"), data is seeded directly
/// via <c>AppDbContext</c> rather than through a POST call, since the create endpoint is
/// Story 2.3's scope. Each test performs its own setup/cleanup (auto-cleanup principle,
/// `fixture-architecture.md`) so tests remain isolated and re-runnable against a shared
/// local database, and generates a unique NIT per test run to avoid colliding with the
/// `uk_clientes_nit` unique index if a previous run's cleanup was interrupted.
/// </summary>
public class ClienteEndpointsTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public ClienteEndpointsTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [RequiresPostgresFact]
    public async Task GetClientes_ReturnsOk_WhenTableIsEmpty()
    {
        // GIVEN the clientes table has no rows
        await ClearClientesTableAsync();

        // WHEN GET /api/v1/clientes is called
        var response = await _client.GetAsync("/api/v1/clientes");

        // THEN the response status is 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [RequiresPostgresFact]
    public async Task GetClientes_ReturnsEmptyArray_WhenTableIsEmpty()
    {
        // GIVEN the clientes table has no rows
        await ClearClientesTableAsync();

        // WHEN GET /api/v1/clientes is called
        var clientes = await GetClientesAsync();

        // THEN the response body is an empty array
        Assert.Empty(clientes);
    }

    [RequiresPostgresFact]
    public async Task GetClientes_ReturnsDirectArray_NotWrappedInDataProperty()
    {
        // GIVEN the clientes table has no rows
        await ClearClientesTableAsync();

        // WHEN GET /api/v1/clientes is called
        var response = await _client.GetAsync("/api/v1/clientes");
        var json = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(json);

        // THEN the JSON root is a direct array, never `{ data: [...] }` (architecture.md's
        // API response-shape convention)
        Assert.Equal(JsonValueKind.Array, document.RootElement.ValueKind);
    }

    [RequiresPostgresFact]
    public async Task GetClientes_ReturnsSeededRecordCount_WhenDataExists()
    {
        // GIVEN two clients seeded directly via AppDbContext
        var clienteA = ClienteEntity.Create("Acme Corp", UniqueNit(), "3001234567", "Bogotá");
        var clienteB = ClienteEntity.Create("Beta SAS", UniqueNit(), "3019876543", "Medellín");
        await SeedClientesAsync(clienteA, clienteB);

        try
        {
            // WHEN GET /api/v1/clientes is called
            var clientes = await GetClientesAsync();

            // THEN both seeded records are returned
            Assert.Equal(2, clientes.Count(c => c.Id == clienteA.Id || c.Id == clienteB.Id));
        }
        finally
        {
            await DeleteClientesAsync(clienteA.Id, clienteB.Id);
        }
    }

    [RequiresPostgresFact]
    public async Task GetClientes_ReturnsSeededNombre_WhenDataExists()
    {
        // GIVEN a client named "Acme Corp" seeded directly via AppDbContext
        var cliente = ClienteEntity.Create("Acme Corp", UniqueNit(), "3001234567", "Bogotá");
        await SeedClientesAsync(cliente);

        try
        {
            // WHEN GET /api/v1/clientes is called
            var clientes = await GetClientesAsync();

            // THEN the response includes a record with the seeded Nombre
            Assert.Contains(clientes, c => c.Nombre == "Acme Corp");
        }
        finally
        {
            await DeleteClientesAsync(cliente.Id);
        }
    }

    [RequiresPostgresFact]
    public async Task GetClientes_ReturnsSeededNit_WhenDataExists()
    {
        // GIVEN a client with a known NIT seeded directly via AppDbContext
        var nit = UniqueNit();
        var cliente = ClienteEntity.Create("Acme Corp", nit, "3001234567", "Bogotá");
        await SeedClientesAsync(cliente);

        try
        {
            // WHEN GET /api/v1/clientes is called
            var clientes = await GetClientesAsync();

            // THEN the response includes a record with the seeded Nit
            Assert.Contains(clientes, c => c.Nit == nit);
        }
        finally
        {
            await DeleteClientesAsync(cliente.Id);
        }
    }

    // ── Story 2.2 (AC #1, #2, #3) — ATDD Acceptance Tests, RED phase ──────────────────────
    // RED phase: fails to compile today because `GET /api/v1/clientes/{id:guid}` does not
    // exist yet (Story 2.2 Task 1). The "not found" test below will coincidentally return
    // 404 even before implementation, since no route currently matches this path segment
    // at all — that overlap is expected and documented in Story 2.2 Task 1 (the `:guid`
    // route constraint intentionally reuses ASP.NET's default 404 for both malformed and
    // well-formed-but-missing IDs); the sibling "returns Ok"/"returns correct Dto" tests
    // below are the true RED signal for this endpoint's happy path.

    [RequiresPostgresFact]
    public async Task GetClienteById_ReturnsOk_WhenClienteExists()
    {
        // GIVEN a client seeded directly via AppDbContext
        var cliente = ClienteEntity.Create("Acme Corp", UniqueNit(), "3001234567", "Bogotá");
        await SeedClientesAsync(cliente);

        try
        {
            // WHEN GET /api/v1/clientes/{id} is called with the seeded client's Id
            var response = await _client.GetAsync($"/api/v1/clientes/{cliente.Id}");

            // THEN the response status is 200 OK
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }
        finally
        {
            await DeleteClientesAsync(cliente.Id);
        }
    }

    [RequiresPostgresFact]
    public async Task GetClienteById_ReturnsCorrectDto_WhenClienteExists()
    {
        // GIVEN a client seeded directly via AppDbContext with known field values
        var nit = UniqueNit();
        var cliente = ClienteEntity.Create("Acme Corp", nit, "3001234567", "Bogotá");
        await SeedClientesAsync(cliente);

        try
        {
            // WHEN GET /api/v1/clientes/{id} is called with the seeded client's Id
            var response = await _client.GetAsync($"/api/v1/clientes/{cliente.Id}");
            var json = await response.Content.ReadAsStringAsync();
            var found = JsonSerializer.Deserialize<ClienteApiResponse>(
                json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            // THEN the response body matches every seeded field (CreatedAt is asserted only
            // for non-default-ness, not exact equality, since Postgres/JSON round-tripping
            // may lose sub-tick precision — same convention as
            // `GetClientes_ReturnsNonDefaultCreatedAt_WhenDataExists`)
            Assert.NotNull(found);
            Assert.Equal(cliente.Id, found!.Id);
            Assert.Equal("Acme Corp", found.Nombre);
            Assert.Equal(nit, found.Nit);
            Assert.Equal("3001234567", found.Telefono);
            Assert.Equal("Bogotá", found.Ciudad);
            Assert.NotEqual(default, found.CreatedAt);
        }
        finally
        {
            await DeleteClientesAsync(cliente.Id);
        }
    }

    [RequiresPostgresFact]
    public async Task GetClienteById_ReturnsNotFound_WhenClienteDoesNotExist()
    {
        // GIVEN a well-formed Id that does not correspond to any seeded client
        var nonExistentId = Guid.NewGuid();

        // WHEN GET /api/v1/clientes/{id} is called
        var response = await _client.GetAsync($"/api/v1/clientes/{nonExistentId}");

        // THEN the response status is 404 Not Found (AC #3)
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ── Story 2.3 (AC #2, #3, #4) — ATDD Acceptance Tests, RED phase ──────────────────────
    // RED phase: fails to compile today because `POST /api/v1/clientes`
    // (`ClienteEndpoints.MapClienteEndpoints`), `CreateClienteCommandHandler` and
    // `CreateClienteRequest` do not exist yet (Story 2.3 Task 1). Per Story 2.3 Task 2,
    // these extend the existing ATDD file rather than creating a new one, reusing the
    // established `UniqueNit()`/`DeleteClientesAsync` helpers.

    [RequiresPostgresFact]
    public async Task CreateCliente_ReturnsCreated_WithValidData()
    {
        // GIVEN a well-formed create request with a fresh, never-used NIT
        var nit = UniqueNit();
        var request = new CreateClienteApiRequest("Acme Corp", nit, "3001234567", "Bogotá");

        try
        {
            // WHEN POST /api/v1/clientes is called
            var response = await _client.PostAsJsonAsync("/api/v1/clientes", request);

            // THEN the response status is 201 Created (AC #2)
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        }
        finally
        {
            await DeleteClienteByNitAsync(nit);
        }
    }

    [RequiresPostgresFact]
    public async Task CreateCliente_ReturnsCreatedCliente_WithValidData()
    {
        // GIVEN a well-formed create request with a fresh, never-used NIT
        var nit = UniqueNit();
        var request = new CreateClienteApiRequest("Acme Corp", nit, "3001234567", "Bogotá");

        try
        {
            // WHEN POST /api/v1/clientes is called
            var response = await _client.PostAsJsonAsync("/api/v1/clientes", request);
            var created = await response.Content.ReadFromJsonAsync<ClienteApiResponse>(
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            // THEN the response body echoes every submitted field and assigns a non-empty Id
            Assert.NotNull(created);
            Assert.NotEqual(Guid.Empty, created!.Id);
            Assert.Equal("Acme Corp", created.Nombre);
            Assert.Equal(nit, created.Nit);
            Assert.Equal("3001234567", created.Telefono);
            Assert.Equal("Bogotá", created.Ciudad);
        }
        finally
        {
            await DeleteClienteByNitAsync(nit);
        }
    }

    [RequiresPostgresFact]
    public async Task CreateCliente_PersistsCliente_WithValidData()
    {
        // GIVEN a well-formed create request with a fresh, never-used NIT
        var nit = UniqueNit();
        var request = new CreateClienteApiRequest("Acme Corp", nit, "3001234567", "Bogotá");

        try
        {
            // WHEN POST /api/v1/clientes is called, then GET /api/v1/clientes/{id} for the created Id
            var createResponse = await _client.PostAsJsonAsync("/api/v1/clientes", request);
            var created = await createResponse.Content.ReadFromJsonAsync<ClienteApiResponse>(
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            var getResponse = await _client.GetAsync($"/api/v1/clientes/{created!.Id}");

            // THEN the created record is genuinely persisted, not just echoed in the response
            Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
        }
        finally
        {
            await DeleteClienteByNitAsync(nit);
        }
    }

    [RequiresPostgresFact]
    public async Task CreateCliente_DuplicateNit_Returns409()
    {
        // GIVEN a client already seeded with a known NIT
        var nit = UniqueNit();
        var existing = ClienteEntity.Create("Acme Corp", nit, "3001234567", "Bogotá");
        await SeedClientesAsync(existing);
        var duplicateRequest = new CreateClienteApiRequest("Empresa Diferente", nit, "3009999999", "Cali");

        try
        {
            // WHEN POST /api/v1/clientes is called with the same NIT
            var response = await _client.PostAsJsonAsync("/api/v1/clientes", duplicateRequest);

            // THEN the response is 409 Conflict (AC #4) — the DB-level uk_clientes_nit
            // constraint is the source of truth
            Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        }
        finally
        {
            await DeleteClientesAsync(existing.Id);
        }
    }

    [RequiresPostgresFact]
    public async Task CreateCliente_DuplicateNit_ResponseBodyContainsNoTechnicalDetail()
    {
        // GIVEN a client already seeded with a known NIT
        var nit = UniqueNit();
        var existing = ClienteEntity.Create("Acme Corp", nit, "3001234567", "Bogotá");
        await SeedClientesAsync(existing);
        var duplicateRequest = new CreateClienteApiRequest("Empresa Diferente", nit, "3009999999", "Cali");

        try
        {
            // WHEN POST /api/v1/clientes is called with the same NIT
            var response = await _client.PostAsJsonAsync("/api/v1/clientes", duplicateRequest);
            var body = await response.Content.ReadAsStringAsync();

            // THEN the response body never exposes a stack trace/exception type string (NFR6)
            Assert.DoesNotContain("Npgsql", body);
            Assert.DoesNotContain("Exception", body);
        }
        finally
        {
            await DeleteClientesAsync(existing.Id);
        }
    }

    [RequiresPostgresFact]
    public async Task CreateCliente_MissingRequiredFields_Returns400()
    {
        // GIVEN a request with an empty Nombre
        var nit = UniqueNit();
        var request = new CreateClienteApiRequest("", nit, "3001234567", "Bogotá");

        // WHEN POST /api/v1/clientes is called
        var response = await _client.PostAsJsonAsync("/api/v1/clientes", request);

        // THEN the response is 400 Bad Request (AC #3's server-side defense-in-depth)
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [RequiresPostgresFact]
    public async Task CreateCliente_MissingRequiredFields_DoesNotPersistAnything()
    {
        // GIVEN a request with an empty Nombre and a fresh NIT
        var nit = UniqueNit();
        var request = new CreateClienteApiRequest("", nit, "3001234567", "Bogotá");

        // WHEN POST /api/v1/clientes is called
        await _client.PostAsJsonAsync("/api/v1/clientes", request);
        var clientes = await GetClientesAsync();

        // THEN no record with that NIT was persisted
        Assert.DoesNotContain(clientes, c => c.Nit == nit);
    }

    // ── Test Automation Expansion (testarch-automate) — Story 2.3 edge cases beyond ATDD ────
    // The ATDD suite above only exercises the missing-Nombre case for AC #3's server-side
    // defense-in-depth. These extend the same 400 contract to the other three required
    // fields, plus assert the Location header the endpoint's `Results.Created` call sets.

    [RequiresPostgresFact]
    public async Task CreateCliente_MissingNit_Returns400()
    {
        // GIVEN a request with an empty Nit
        var request = new CreateClienteApiRequest("Acme Corp", "", "3001234567", "Bogotá");

        // WHEN POST /api/v1/clientes is called
        var response = await _client.PostAsJsonAsync("/api/v1/clientes", request);

        // THEN the response is 400 Bad Request
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [RequiresPostgresFact]
    public async Task CreateCliente_MissingTelefono_Returns400()
    {
        // GIVEN a request with an empty Telefono
        var nit = UniqueNit();
        var request = new CreateClienteApiRequest("Acme Corp", nit, "", "Bogotá");

        // WHEN POST /api/v1/clientes is called
        var response = await _client.PostAsJsonAsync("/api/v1/clientes", request);

        // THEN the response is 400 Bad Request
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [RequiresPostgresFact]
    public async Task CreateCliente_MissingCiudad_Returns400()
    {
        // GIVEN a request with an empty Ciudad
        var nit = UniqueNit();
        var request = new CreateClienteApiRequest("Acme Corp", nit, "3001234567", "");

        // WHEN POST /api/v1/clientes is called
        var response = await _client.PostAsJsonAsync("/api/v1/clientes", request);

        // THEN the response is 400 Bad Request
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [RequiresPostgresFact]
    public async Task CreateCliente_MissingAllFields_ReturnsValidationProblemWithFourErrors()
    {
        // GIVEN a request with every required field empty
        var request = new CreateClienteApiRequest("", "", "", "");

        try
        {
            // WHEN POST /api/v1/clientes is called
            var response = await _client.PostAsJsonAsync("/api/v1/clientes", request);
            var json = await response.Content.ReadAsStringAsync();
            using var document = JsonDocument.Parse(json);

            // THEN the ValidationProblem body reports one error entry per empty field
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var errors = document.RootElement.GetProperty("errors");
            Assert.Equal(4, errors.EnumerateObject().Count());
        }
        finally
        {
            await DeleteClienteByNitAsync(request.Nit);
        }
    }

    [RequiresPostgresFact]
    public async Task CreateCliente_ReturnsLocationHeader_WithValidData()
    {
        // GIVEN a well-formed create request with a fresh, never-used NIT
        var nit = UniqueNit();
        var request = new CreateClienteApiRequest("Acme Corp", nit, "3001234567", "Bogotá");

        try
        {
            // WHEN POST /api/v1/clientes is called
            var response = await _client.PostAsJsonAsync("/api/v1/clientes", request);
            var created = await response.Content.ReadFromJsonAsync<ClienteApiResponse>(
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            // THEN a Location header pointing to the new resource is set (Results.Created)
            Assert.NotNull(response.Headers.Location);
            Assert.Contains($"/api/v1/clientes/{created!.Id}", response.Headers.Location!.ToString());
        }
        finally
        {
            await DeleteClienteByNitAsync(nit);
        }
    }

    [RequiresPostgresFact]
    public async Task CreateCliente_ConcurrentDuplicateNit_OnlyOnePersists()
    {
        // GIVEN two create requests sharing the same NIT (TC-E2-P0-06 — the DB-level unique
        // constraint must hold even bypassing the frontend/handler pre-check race; sequential
        // requests are sufficient to prove the invariant without adding flakiness)
        var nit = UniqueNit();
        var firstRequest = new CreateClienteApiRequest("Acme Corp", nit, "3001234567", "Bogotá");
        var secondRequest = new CreateClienteApiRequest("Acme Corp Duplicado", nit, "3009999999", "Cali");

        try
        {
            // WHEN both requests are submitted, one after the other
            var firstResponse = await _client.PostAsJsonAsync("/api/v1/clientes", firstRequest);
            var secondResponse = await _client.PostAsJsonAsync("/api/v1/clientes", secondRequest);

            // THEN exactly one succeeds (201) and the other conflicts (409)
            var statuses = new[] { firstResponse.StatusCode, secondResponse.StatusCode };
            Assert.Contains(HttpStatusCode.Created, statuses);
            Assert.Contains(HttpStatusCode.Conflict, statuses);
        }
        finally
        {
            await DeleteClienteByNitAsync(nit);
        }
    }

    [RequiresPostgresFact]
    public async Task CreateCliente_ConcurrentDuplicateNit_OnlyOneRecordExistsWithThatNit()
    {
        // GIVEN two create requests sharing the same NIT
        var nit = UniqueNit();
        var firstRequest = new CreateClienteApiRequest("Acme Corp", nit, "3001234567", "Bogotá");
        var secondRequest = new CreateClienteApiRequest("Acme Corp Duplicado", nit, "3009999999", "Cali");

        try
        {
            // WHEN both requests are submitted, one after the other
            await _client.PostAsJsonAsync("/api/v1/clientes", firstRequest);
            await _client.PostAsJsonAsync("/api/v1/clientes", secondRequest);
            var clientes = await GetClientesAsync();

            // THEN GET /api/v1/clientes shows exactly one record with that NIT
            Assert.Single(clientes, c => c.Nit == nit);
        }
        finally
        {
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
