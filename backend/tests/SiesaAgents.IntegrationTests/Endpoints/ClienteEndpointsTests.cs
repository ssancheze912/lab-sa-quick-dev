using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SiesaAgents.Application.DTOs;
using SiesaAgents.Domain.Entities;
using SiesaAgents.Infrastructure.Data;
using SiesaAgents.IntegrationTests.Support;

namespace SiesaAgents.IntegrationTests.Endpoints;

/// <summary>
/// Story 2.1 (AC #1, #2): `GET /api/v1/clientes` end-to-end via the real ASP.NET
/// pipeline (TestApiFactory -> Program.cs), independent of the frontend's
/// client-side filtering (TC-E2-P2-08 backend-path coverage).
/// </summary>
public class ClienteEndpointsTests : IClassFixture<TestApiFactory>, IAsyncLifetime
{
    private const string ConnectionString =
        "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres";

    private readonly TestApiFactory _factory;
    private readonly List<Guid> _createdIds = [];

    public ClienteEndpointsTests(TestApiFactory factory)
    {
        _factory = factory;
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync()
    {
        if (_createdIds.Count == 0)
        {
            return;
        }

        await using var context = CreateContext();
        var toRemove = await context.Clientes.Where(c => _createdIds.Contains(c.Id)).ToListAsync();
        context.Clientes.RemoveRange(toRemove);
        await context.SaveChangesAsync();
    }

    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(ConnectionString, npgsql => { })
            .ReplaceService<IHistoryRepository, SnakeCaseNpgsqlHistoryRepository>()
            .Options;
        return new AppDbContext(options);
    }

    private async Task<ClienteEntity> SeedAsync(string nombre, string nit)
    {
        await using var context = CreateContext();
        var cliente = ClienteEntity.Create(nombre, nit, "3000000000", "Bogotá");
        context.Clientes.Add(cliente);
        await context.SaveChangesAsync();
        _createdIds.Add(cliente.Id);
        return cliente;
    }

    [Fact]
    public async Task GetClientes_ReturnsOk()
    {
        // GIVEN a client
        var suffix = Guid.NewGuid().ToString("N")[..8];
        await SeedAsync($"Endpoint Cliente {suffix}", $"700{suffix}");
        var client = _factory.CreateClient();

        // WHEN calling GET /api/v1/clientes
        var response = await client.GetAsync("/api/v1/clientes");

        // THEN the response is 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetClientes_ReturnsAllSeededClientes()
    {
        // GIVEN a seeded client
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var seeded = await SeedAsync($"Todos Cliente {suffix}", $"701{suffix}");
        var client = _factory.CreateClient();

        // WHEN calling GET /api/v1/clientes without a search term
        var result = await client.GetFromJsonAsync<List<ClienteDto>>("/api/v1/clientes");

        // THEN the seeded client is present in the response
        Assert.NotNull(result);
        Assert.Contains(result!, c => c.Id == seeded.Id);
    }

    [Fact]
    public async Task GetClientes_WithSearchTerm_ReturnsOnlyMatchingClientes()
    {
        // GIVEN two clients with distinct names
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var target = await SeedAsync($"Filtrado Especial {suffix}", $"702{suffix}");
        await SeedAsync($"Otro Diferente {suffix}", $"703{suffix}");
        var client = _factory.CreateClient();

        // WHEN calling GET /api/v1/clientes?q=<term matching only target>
        var result = await client.GetFromJsonAsync<List<ClienteDto>>($"/api/v1/clientes?q=Filtrado Especial {suffix}");

        // THEN only the matching client is returned
        Assert.NotNull(result);
        Assert.Contains(result!, c => c.Id == target.Id);
        Assert.DoesNotContain(result!, c => c.Nombre.StartsWith("Otro Diferente"));
    }

    // --- Edge cases (testarch-automate expansion) -----------------------------

    [Fact]
    public async Task GetClientes_WithEmptyQueryParam_ReturnsAllClientesLikeNoParam()
    {
        // GIVEN a seeded client
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var seeded = await SeedAsync($"Empty Query Cliente {suffix}", $"704{suffix}");
        var client = _factory.CreateClient();

        // WHEN calling GET /api/v1/clientes?q= (empty string, not omitted)
        var result = await client.GetFromJsonAsync<List<ClienteDto>>("/api/v1/clientes?q=");

        // THEN the empty query param behaves like no filter — client is returned
        Assert.NotNull(result);
        Assert.Contains(result!, c => c.Id == seeded.Id);
    }

    [Fact]
    public async Task GetClientes_WithUrlEncodedSpecialCharacters_ReturnsExpectedMatch()
    {
        // GIVEN a client whose name contains an ampersand (must survive URL encoding round-trip)
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var target = await SeedAsync($"Cliente & Asociados {suffix}", $"705{suffix}");
        var client = _factory.CreateClient();

        // WHEN calling with a URL-encoded search term
        var encoded = Uri.EscapeDataString($"& Asociados {suffix}");
        var result = await client.GetFromJsonAsync<List<ClienteDto>>($"/api/v1/clientes?q={encoded}");

        // THEN the client matches despite the special character
        Assert.NotNull(result);
        Assert.Contains(result!, c => c.Id == target.Id);
    }

    [Fact]
    public async Task GetClientes_WithNonMatchingSearchTerm_ReturnsEmptyArrayNot404()
    {
        // GIVEN a seeded client that won't match
        var suffix = Guid.NewGuid().ToString("N")[..8];
        await SeedAsync($"Cliente Existente {suffix}", $"706{suffix}");
        var client = _factory.CreateClient();

        // WHEN searching for a term that matches nothing
        var response = await client.GetAsync($"/api/v1/clientes?q=zzz-inexistente-{suffix}");
        var result = await response.Content.ReadFromJsonAsync<List<ClienteDto>>();

        // THEN the endpoint still returns 200 OK with an empty array (not 404/error)
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(result);
        Assert.Empty(result!);
    }

    [Fact]
    public async Task GetClientes_ResponseUsesCamelCaseJsonPropertyNames()
    {
        // GIVEN a seeded client
        var suffix = Guid.NewGuid().ToString("N")[..8];
        await SeedAsync($"CamelCase Cliente {suffix}", $"707{suffix}");
        var client = _factory.CreateClient();

        // WHEN calling GET /api/v1/clientes
        var response = await client.GetAsync("/api/v1/clientes");
        var rawJson = await response.Content.ReadAsStringAsync();

        // THEN the JSON payload exposes camelCase keys matching the frontend's Cliente interface
        Assert.Contains("\"nombre\"", rawJson);
        Assert.Contains("\"nit\"", rawJson);
        Assert.Contains("\"createdAt\"", rawJson);
    }

    // --- Story 2.2: GET /api/v1/clientes/{id} (AC #1, #2, #3) -------------------
    //
    // RED PHASE: the GET /api/v1/clientes/{id:guid} endpoint does not exist yet
    // (Story 2.2, Task 1). These tests define the expected contract: 200 + the
    // correct ClienteDto for an existing client, and 404 + Problem Details (no
    // stack trace / no technical leakage per NFR6) for a non-existent Id.

    [Fact]
    public async Task GetClienteById_WithExistingId_ReturnsOk()
    {
        // GIVEN a seeded client
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var seeded = await SeedAsync($"Detalle Endpoint Cliente {suffix}", $"708{suffix}");
        var client = _factory.CreateClient();

        // WHEN calling GET /api/v1/clientes/{id} with an existing Id
        var response = await client.GetAsync($"/api/v1/clientes/{seeded.Id}");

        // THEN the response is 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetClienteById_WithExistingId_ReturnsTheCorrectClienteDto()
    {
        // GIVEN a seeded client
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var seeded = await SeedAsync($"Correcto Cliente {suffix}", $"709{suffix}");
        var client = _factory.CreateClient();

        // WHEN calling GET /api/v1/clientes/{id}
        var result = await client.GetFromJsonAsync<ClienteDto>($"/api/v1/clientes/{seeded.Id}");

        // THEN the returned DTO matches the seeded client's fields
        Assert.NotNull(result);
        Assert.Equal(seeded.Id, result!.Id);
        Assert.Equal(seeded.Nombre, result.Nombre);
        Assert.Equal(seeded.Nit, result.Nit);
        Assert.Equal(seeded.Telefono, result.Telefono);
        Assert.Equal(seeded.Ciudad, result.Ciudad);
    }

    [Fact]
    public async Task GetClienteById_WithNonExistentId_ReturnsNotFound()
    {
        // GIVEN a well-formed UUID with no matching client
        var client = _factory.CreateClient();
        var nonExistentId = Guid.NewGuid();

        // WHEN calling GET /api/v1/clientes/{id}
        var response = await client.GetAsync($"/api/v1/clientes/{nonExistentId}");

        // THEN the response is 404 Not Found
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetClienteById_WithNonExistentId_ReturnsProblemDetailsWithoutStackTrace()
    {
        // GIVEN a well-formed UUID with no matching client
        var client = _factory.CreateClient();
        var nonExistentId = Guid.NewGuid();

        // WHEN calling GET /api/v1/clientes/{id}
        var response = await client.GetAsync($"/api/v1/clientes/{nonExistentId}");
        var rawJson = await response.Content.ReadAsStringAsync();

        // THEN the body is RFC 7807 Problem Details shaped, with no stack trace or
        // technical leakage (NFR6)
        Assert.Contains("\"status\"", rawJson);
        Assert.DoesNotContain("StackTrace", rawJson, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("System.Exception", rawJson, StringComparison.OrdinalIgnoreCase);
    }

    // --- Edge cases (testarch-automate expansion) -----------------------------

    [Fact]
    public async Task GetClienteById_WithGuidEmptyRouteSegment_ReturnsNotFound()
    {
        // GIVEN the well-formed but all-zeros GUID explicitly used in the story's
        // AC #3 / TC-E2-P1-07 example — must resolve identically to any other
        // non-existent well-formed Id (404, not a routing/binding special case)
        var client = _factory.CreateClient();

        // WHEN calling GET /api/v1/clientes/00000000-0000-0000-0000-000000000000
        var response = await client.GetAsync($"/api/v1/clientes/{Guid.Empty}");

        // THEN the response is 404 Not Found, same contract as any other missing Id
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetClienteById_WithMalformedGuidRouteSegment_ReturnsBadRequestNot500()
    {
        // GIVEN a route segment that is not a parseable GUID at all (route constraint
        // is `{id:guid}` — an unparsable value should fail route binding gracefully,
        // not reach application code and throw an unhandled exception)
        var client = _factory.CreateClient();

        // WHEN calling GET /api/v1/clientes/not-a-guid
        var response = await client.GetAsync("/api/v1/clientes/not-a-guid");

        // THEN the request fails at routing/binding (400/404), never a 500 — the
        // :guid route constraint means this path simply doesn't match this endpoint
        Assert.NotEqual(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    [Fact]
    public async Task GetClienteById_ResponseUsesCamelCaseJsonPropertyNames()
    {
        // GIVEN a seeded client
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var seeded = await SeedAsync($"CamelCase Detalle Cliente {suffix}", $"710{suffix}");
        var client = _factory.CreateClient();

        // WHEN calling GET /api/v1/clientes/{id}
        var response = await client.GetAsync($"/api/v1/clientes/{seeded.Id}");
        var rawJson = await response.Content.ReadAsStringAsync();

        // THEN the JSON payload exposes camelCase keys matching the frontend's Cliente interface
        Assert.Contains("\"nombre\"", rawJson);
        Assert.Contains("\"nit\"", rawJson);
        Assert.Contains("\"telefono\"", rawJson);
        Assert.Contains("\"ciudad\"", rawJson);
    }

    [Fact]
    public async Task GetClienteById_DoesNotReturnAClienteDeletedAfterCreation()
    {
        // GIVEN a client that existed and was then deleted directly via the database
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var seeded = await SeedAsync($"Eliminado Endpoint Cliente {suffix}", $"711{suffix}");
        await using (var context = CreateContext())
        {
            var toDelete = await context.Clientes.FindAsync(seeded.Id);
            Assert.NotNull(toDelete);
            context.Clientes.Remove(toDelete!);
            await context.SaveChangesAsync();
        }
        _createdIds.Remove(seeded.Id);
        var client = _factory.CreateClient();

        // WHEN calling GET /api/v1/clientes/{id} for the now-deleted client
        var response = await client.GetAsync($"/api/v1/clientes/{seeded.Id}");

        // THEN the endpoint returns 404, consistent with the never-existed case
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // --- Story 2.3: POST /api/v1/clientes (AC #2, #4, #5) -----------------------
    //
    // RED PHASE: `POST /api/v1/clientes` does not exist yet (Story 2.3, Task 3).
    // These tests define the expected contract:
    //   - Valid payload -> 201 Created + ClienteDto (TC-E2-P0-06 backend leg)
    //   - Duplicate NIT/RUC -> 409 Conflict, Spanish detail, no tech leakage (TC-E2-P0-01, R1)
    //   - Empty/whitespace-only required fields -> 400 Bad Request with field errors (TC-E2-P0-05, R3)

    private static object ValidPayload(string suffix) => new
    {
        nombre = $"Cliente POST {suffix}",
        nit = $"POST{suffix}",
        telefono = "3009998877",
        ciudad = "Barranquilla",
    };

    [Fact]
    public async Task PostClientes_WithValidPayload_ReturnsCreated()
    {
        // GIVEN a valid client payload
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var client = _factory.CreateClient();

        // WHEN calling POST /api/v1/clientes
        var response = await client.PostAsJsonAsync("/api/v1/clientes", ValidPayload(suffix));

        // THEN the response is 201 Created
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var created = await response.Content.ReadFromJsonAsync<ClienteDto>();
        if (created is not null) _createdIds.Add(created.Id);
    }

    [Fact]
    public async Task PostClientes_WithValidPayload_ReturnsBodyMatchingSubmittedFields()
    {
        // GIVEN a valid client payload
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var client = _factory.CreateClient();
        var payload = ValidPayload(suffix);

        // WHEN calling POST /api/v1/clientes
        var response = await client.PostAsJsonAsync("/api/v1/clientes", payload);
        var created = await response.Content.ReadFromJsonAsync<ClienteDto>();
        if (created is not null) _createdIds.Add(created.Id);

        // THEN the returned ClienteDto reflects the submitted values (TC-E2-P0-06 backend leg)
        Assert.NotNull(created);
        Assert.NotEqual(Guid.Empty, created!.Id);
        Assert.Equal($"Cliente POST {suffix}", created.Nombre);
        Assert.Equal($"POST{suffix}", created.Nit);
        Assert.Equal("3009998877", created.Telefono);
        Assert.Equal("Barranquilla", created.Ciudad);
    }

    [Fact]
    public async Task PostClientes_WithValidPayload_IncludesLocationHeaderPointingToGetById()
    {
        // GIVEN a valid client payload
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var client = _factory.CreateClient();

        // WHEN calling POST /api/v1/clientes
        var response = await client.PostAsJsonAsync("/api/v1/clientes", ValidPayload(suffix));
        var created = await response.Content.ReadFromJsonAsync<ClienteDto>();
        if (created is not null) _createdIds.Add(created.Id);

        // THEN the Location header points to GET /api/v1/clientes/{id} per REST convention
        Assert.NotNull(response.Headers.Location);
        Assert.Contains($"/api/v1/clientes/{created!.Id}", response.Headers.Location!.ToString());
    }

    [Fact]
    public async Task PostClientes_WithDuplicateNit_ReturnsConflict()
    {
        // GIVEN a client already persisted with a known NIT/RUC
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var existing = await SeedAsync($"Original Conflicto {suffix}", $"CONF{suffix}");
        var client = _factory.CreateClient();

        // WHEN posting a second client with the same NIT/RUC but a different Nombre
        var response = await client.PostAsJsonAsync("/api/v1/clientes", new
        {
            nombre = "Empresa Diferente",
            nit = existing.Nit,
            telefono = "3001112233",
            ciudad = "Cali",
        });

        // THEN the response is 409 Conflict (TC-E2-P0-01, R1)
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task PostClientes_WithDuplicateNit_ReturnsProblemDetailsWithSpanishMessageAndNoTechnicalLeakage()
    {
        // GIVEN a client already persisted with a known NIT/RUC
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var existing = await SeedAsync($"Original Detalle {suffix}", $"CONFD{suffix}");
        var client = _factory.CreateClient();

        // WHEN posting a duplicate-NIT client
        var response = await client.PostAsJsonAsync("/api/v1/clientes", new
        {
            nombre = "Empresa Duplicada",
            nit = existing.Nit,
            telefono = "3001112233",
            ciudad = "Cali",
        });
        var rawJson = await response.Content.ReadAsStringAsync();

        // THEN the Problem Details body's `detail` reads exactly the Spanish
        // user-facing message (NFR6) — no DB constraint name, stack trace, or
        // "Npgsql"/"23505"/"DbUpdateException" text should leak to the client.
        Assert.Contains("El NIT/RUC ya está registrado", rawJson);
        Assert.DoesNotContain("Npgsql", rawJson, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("DbUpdateException", rawJson, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("StackTrace", rawJson, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("uk_clientes_nit", rawJson, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task PostClientes_WithDuplicateNit_DoesNotPersistASecondRecord()
    {
        // GIVEN a client already persisted with a known NIT/RUC
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var existing = await SeedAsync($"Original Conteo {suffix}", $"CONFC{suffix}");
        var client = _factory.CreateClient();

        // WHEN posting a duplicate-NIT client (rejected with 409)
        await client.PostAsJsonAsync("/api/v1/clientes", new
        {
            nombre = "Empresa No Persistida",
            nit = existing.Nit,
            telefono = "3001112233",
            ciudad = "Cali",
        });

        // THEN only the original record with that NIT exists — no duplicate was persisted
        await using var context = CreateContext();
        var count = await context.Clientes.CountAsync(c => c.Nit == existing.Nit);
        Assert.Equal(1, count);
    }

    [Fact]
    public async Task PostClientes_WithEmptyNombreAndMissingNit_ReturnsBadRequest()
    {
        // GIVEN a payload with an empty Nombre and an omitted Nit (bypasses the UI
        // entirely, proving backend validation is independent of frontend Zod, R3)
        var client = _factory.CreateClient();

        // WHEN calling POST /api/v1/clientes
        var response = await client.PostAsJsonAsync("/api/v1/clientes", new
        {
            nombre = "",
            telefono = "3000000000",
            ciudad = "Bogotá",
        });

        // THEN the response is 400 Bad Request (TC-E2-P0-05)
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task PostClientes_WithEmptyNombreAndMissingNit_ReturnsFieldLevelErrorsForBoth()
    {
        // GIVEN a payload with an empty Nombre and an omitted Nit
        var client = _factory.CreateClient();

        // WHEN calling POST /api/v1/clientes
        var response = await client.PostAsJsonAsync("/api/v1/clientes", new
        {
            nombre = "",
            telefono = "3000000000",
            ciudad = "Bogotá",
        });
        var rawJson = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(rawJson);

        // THEN FluentValidation field-level error details are present for both fields
        // (errors: { nombre: [...], nit: [...] } shape, case-insensitive key lookup)
        var errors = doc.RootElement.GetProperty("errors");
        var keys = errors.EnumerateObject().Select(p => p.Name.ToLowerInvariant()).ToList();
        Assert.Contains("nombre", keys);
        Assert.Contains("nit", keys);
    }

    [Fact]
    public async Task PostClientes_WithAllFieldsWhitespaceOnly_ReturnsBadRequest()
    {
        // GIVEN a payload where every required field is whitespace-only
        var client = _factory.CreateClient();

        // WHEN calling POST /api/v1/clientes
        var response = await client.PostAsJsonAsync("/api/v1/clientes", new
        {
            nombre = "   ",
            nit = "   ",
            telefono = "   ",
            ciudad = "   ",
        });

        // THEN the response is 400 Bad Request — NotEmpty()'s trim-aware check
        // rejects whitespace-only values, not just null/empty (TC-E2-P0-05)
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task PostClientes_WithInvalidPayload_DoesNotPersistAnyRecord()
    {
        // GIVEN the current count of clientes matching a unique marker NIT that
        // would only exist if the invalid payload were (incorrectly) persisted
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var client = _factory.CreateClient();

        // WHEN posting an invalid (whitespace-only) payload carrying a traceable NIT
        await client.PostAsJsonAsync("/api/v1/clientes", new
        {
            nombre = "   ",
            nit = $"SHOULD-NOT-PERSIST-{suffix}",
            telefono = "   ",
            ciudad = "   ",
        });

        // THEN no record with that NIT was persisted (validation failure blocks insert)
        await using var context = CreateContext();
        var exists = await context.Clientes.AnyAsync(c => c.Nit == $"SHOULD-NOT-PERSIST-{suffix}");
        Assert.False(exists);
    }

    // --- Edge cases (testarch-automate expansion) -------------------------------

    [Fact]
    public async Task PostClientes_WithMissingBody_ReturnsBadRequestNot500()
    {
        // GIVEN an empty request body (not even an empty JSON object)
        var client = _factory.CreateClient();

        // WHEN posting with no content
        var response = await client.PostAsync("/api/v1/clientes", new StringContent(string.Empty));

        // THEN the request fails gracefully at model binding — never a 500
        Assert.NotEqual(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    [Fact]
    public async Task PostClientes_WithDuplicateNitDifferingOnlyByCase_IsTreatedAsDistinctAndReturnsCreated()
    {
        // GIVEN a client already persisted with a known NIT/RUC
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var existing = await SeedAsync($"Original Case {suffix}", $"caseNIT{suffix}");
        var client = _factory.CreateClient();

        // WHEN posting a second client whose Nit differs only by letter case
        var response = await client.PostAsJsonAsync("/api/v1/clientes", new
        {
            nombre = "Empresa Case Diferente",
            nit = $"caseNIT{suffix}".ToUpperInvariant(),
            telefono = "3001112233",
            ciudad = "Cali",
        });
        var created = await response.Content.ReadFromJsonAsync<ClienteDto>();
        if (created is not null) _createdIds.Add(created.Id);

        // THEN the DB-level unique index uses Postgres's default case-sensitive
        // collation — a differently-cased Nit is a distinct value, so this
        // succeeds (documents actual behavior; NOT a business-rule claim that
        // case-insensitive dedup is out of scope for this story)
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task PostClientes_WithValuesContainingSurroundingWhitespace_PersistsAndReturns201()
    {
        // GIVEN a payload whose values carry incidental leading/trailing whitespace
        // but are not whitespace-only — FluentValidation's NotEmpty() must accept
        // this (only pure-whitespace values are rejected)
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var client = _factory.CreateClient();

        // WHEN calling POST /api/v1/clientes
        var response = await client.PostAsJsonAsync("/api/v1/clientes", new
        {
            nombre = $"  Cliente Con Espacios {suffix}  ",
            nit = $"  WS{suffix}  ",
            telefono = "  3009998877  ",
            ciudad = "  Barranquilla  ",
        });
        var created = await response.Content.ReadFromJsonAsync<ClienteDto>();
        if (created is not null) _createdIds.Add(created.Id);

        // THEN the client is created successfully (201)
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    // --- Story 2.4: PUT /api/v1/clientes/{id} (AC #2, #3, #5, #7) ---------------
    //
    // RED PHASE: `PUT /api/v1/clientes/{id}` does not exist yet (Story 2.4, Task
    // 3). These tests define the expected contract:
    //   - Valid payload -> 200 OK + updated ClienteDto (AC #2)
    //   - Non-existent Id -> 404 Not Found
    //   - Empty/whitespace-only required fields -> 400 Bad Request with
    //     field-level errors, independent of the frontend (AC #3, R3)
    //   - Duplicate NIT/RUC from a DIFFERENT client -> 409 Conflict, Spanish
    //     detail, no tech leakage (AC #5, mirrors Story 2.3's R1)
    //   - Self-update with unchanged NIT -> 200 OK, no false 409 (AC #7)

    private static object ValidUpdatePayload(string suffix) => new
    {
        nombre = $"Cliente PUT {suffix}",
        nit = $"PUT{suffix}",
        telefono = "3005554433",
        ciudad = "Manizales",
    };

    [Fact]
    public async Task PutClientes_WithValidPayload_ReturnsOk()
    {
        // GIVEN an existing seeded client
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var seeded = await SeedAsync($"Original PUT {suffix}", $"OPUT{suffix}");
        var client = _factory.CreateClient();

        // WHEN calling PUT /api/v1/clientes/{id} with valid changes
        var response = await client.PutAsJsonAsync($"/api/v1/clientes/{seeded.Id}", ValidUpdatePayload(suffix));

        // THEN the response is 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task PutClientes_WithValidPayload_ReturnsBodyReflectingTheSubmittedChanges()
    {
        // GIVEN an existing seeded client
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var seeded = await SeedAsync($"Original Reflejo {suffix}", $"OREF{suffix}");
        var client = _factory.CreateClient();
        var payload = ValidUpdatePayload(suffix);

        // WHEN calling PUT /api/v1/clientes/{id}
        var updated = await client.PutAsJsonAsync($"/api/v1/clientes/{seeded.Id}", payload)
            .ContinueWith(t => t.Result.Content.ReadFromJsonAsync<ClienteDto>()).Unwrap();

        // THEN the returned ClienteDto reflects the submitted values, same Id
        Assert.NotNull(updated);
        Assert.Equal(seeded.Id, updated!.Id);
        Assert.Equal($"Cliente PUT {suffix}", updated.Nombre);
        Assert.Equal($"PUT{suffix}", updated.Nit);
        Assert.Equal("3005554433", updated.Telefono);
        Assert.Equal("Manizales", updated.Ciudad);
    }

    [Fact]
    public async Task PutClientes_WithValidPayload_ChangeIsPersistedAndVisibleOnSubsequentGet()
    {
        // GIVEN an existing seeded client
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var seeded = await SeedAsync($"Original Persistencia {suffix}", $"OPST{suffix}");
        var client = _factory.CreateClient();

        // WHEN updating it via PUT and then re-fetching via GET
        await client.PutAsJsonAsync($"/api/v1/clientes/{seeded.Id}", ValidUpdatePayload(suffix));
        var refetched = await client.GetFromJsonAsync<ClienteDto>($"/api/v1/clientes/{seeded.Id}");

        // THEN the GET reflects the update immediately, no caching staleness (FR27/NFR2)
        Assert.NotNull(refetched);
        Assert.Equal($"Cliente PUT {suffix}", refetched!.Nombre);
    }

    [Fact]
    public async Task PutClientes_WithNonExistentId_ReturnsNotFound()
    {
        // GIVEN a well-formed UUID with no matching client
        var client = _factory.CreateClient();
        var nonExistentId = Guid.NewGuid();

        // WHEN calling PUT /api/v1/clientes/{id}
        var response = await client.PutAsJsonAsync($"/api/v1/clientes/{nonExistentId}", ValidUpdatePayload("nf"));

        // THEN the response is 404 Not Found
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task PutClientes_WithEmptyRequiredFields_ReturnsBadRequest()
    {
        // GIVEN an existing seeded client and a payload bypassing the frontend
        // entirely with empty/whitespace-only required fields (AC #3, R3)
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var seeded = await SeedAsync($"Original Validacion {suffix}", $"OVAL{suffix}");
        var client = _factory.CreateClient();

        // WHEN calling PUT /api/v1/clientes/{id}
        var response = await client.PutAsJsonAsync($"/api/v1/clientes/{seeded.Id}", new
        {
            nombre = "",
            nit = "   ",
            telefono = "3000000000",
            ciudad = "Bogotá",
        });

        // THEN the response is 400 Bad Request
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task PutClientes_WithEmptyRequiredFields_ReturnsFieldLevelErrorsAndDoesNotPersist()
    {
        // GIVEN an existing seeded client
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var seeded = await SeedAsync($"Original Sin Cambios {suffix}", $"OSC{suffix}");
        var client = _factory.CreateClient();

        // WHEN calling PUT /api/v1/clientes/{id} with an empty Nombre
        var response = await client.PutAsJsonAsync($"/api/v1/clientes/{seeded.Id}", new
        {
            nombre = "",
            nit = seeded.Nit,
            telefono = seeded.Telefono,
            ciudad = seeded.Ciudad,
        });
        var rawJson = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(rawJson);

        // THEN FluentValidation field-level errors are present for Nombre, and
        // the original record remains unchanged (no partial persistence)
        var errors = doc.RootElement.GetProperty("errors");
        var keys = errors.EnumerateObject().Select(p => p.Name.ToLowerInvariant()).ToList();
        Assert.Contains("nombre", keys);

        var unchanged = await client.GetFromJsonAsync<ClienteDto>($"/api/v1/clientes/{seeded.Id}");
        Assert.Equal($"Original Sin Cambios {suffix}", unchanged!.Nombre);
    }

    [Fact]
    public async Task PutClientes_WithNitCollidingWithADifferentClient_ReturnsConflict()
    {
        // GIVEN two existing clients with distinct NITs
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var clientA = await SeedAsync($"Conflicto A {suffix}", $"CFA{suffix}");
        var clientB = await SeedAsync($"Conflicto B {suffix}", $"CFB{suffix}");
        var client = _factory.CreateClient();

        // WHEN updating client B to use client A's NIT/RUC
        var response = await client.PutAsJsonAsync($"/api/v1/clientes/{clientB.Id}", new
        {
            nombre = clientB.Nombre,
            nit = clientA.Nit,
            telefono = clientB.Telefono,
            ciudad = clientB.Ciudad,
        });

        // THEN the response is 409 Conflict (AC #5)
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task PutClientes_WithNitCollidingWithADifferentClient_ReturnsSpanishMessageWithoutTechnicalLeakage()
    {
        // GIVEN two existing clients with distinct NITs
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var clientA = await SeedAsync($"Conflicto Detalle A {suffix}", $"CFDA{suffix}");
        var clientB = await SeedAsync($"Conflicto Detalle B {suffix}", $"CFDB{suffix}");
        var client = _factory.CreateClient();

        // WHEN updating client B to use client A's NIT/RUC
        var response = await client.PutAsJsonAsync($"/api/v1/clientes/{clientB.Id}", new
        {
            nombre = clientB.Nombre,
            nit = clientA.Nit,
            telefono = clientB.Telefono,
            ciudad = clientB.Ciudad,
        });
        var rawJson = await response.Content.ReadAsStringAsync();

        // THEN the Problem Details `detail` is the exact Spanish message (NFR6),
        // with no DB/stack-trace leakage
        Assert.Contains("El NIT/RUC ya está registrado", rawJson);
        Assert.DoesNotContain("Npgsql", rawJson, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("DbUpdateException", rawJson, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("uk_clientes_nit", rawJson, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task PutClientes_WithNitCollidingWithADifferentClient_DoesNotPersistTheChange()
    {
        // GIVEN two existing clients with distinct NITs
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var clientA = await SeedAsync($"Conflicto Persistencia A {suffix}", $"CFPA{suffix}");
        var clientB = await SeedAsync($"Conflicto Persistencia B {suffix}", $"CFPB{suffix}");
        var client = _factory.CreateClient();

        // WHEN attempting to update client B to use client A's NIT/RUC (rejected)
        await client.PutAsJsonAsync($"/api/v1/clientes/{clientB.Id}", new
        {
            nombre = "Nombre Que No Debe Persistir",
            nit = clientA.Nit,
            telefono = clientB.Telefono,
            ciudad = clientB.Ciudad,
        });

        // THEN client B's original Nombre/Nit remain unchanged
        var unchanged = await client.GetFromJsonAsync<ClienteDto>($"/api/v1/clientes/{clientB.Id}");
        Assert.Equal($"Conflicto Persistencia B {suffix}", unchanged!.Nombre);
        Assert.Equal($"CFPB{suffix}", unchanged.Nit);
    }

    [Fact]
    public async Task PutClientes_WithSelfUnchangedNit_ReturnsOkNotConflict()
    {
        // GIVEN an existing client
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var seeded = await SeedAsync($"Self Unchanged {suffix}", $"SELFU{suffix}");
        var client = _factory.CreateClient();

        // WHEN updating it with its OWN unchanged NIT (only Ciudad changes)
        var response = await client.PutAsJsonAsync($"/api/v1/clientes/{seeded.Id}", new
        {
            nombre = seeded.Nombre,
            nit = seeded.Nit,
            telefono = seeded.Telefono,
            ciudad = "Cúcuta",
        });

        // THEN the update succeeds — self-exclusion, no false 409 (AC #7)
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task PutClientes_ResponseUsesCamelCaseJsonPropertyNames()
    {
        // GIVEN an existing seeded client
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var seeded = await SeedAsync($"CamelCase PUT {suffix}", $"CCPUT{suffix}");
        var client = _factory.CreateClient();

        // WHEN calling PUT /api/v1/clientes/{id}
        var response = await client.PutAsJsonAsync($"/api/v1/clientes/{seeded.Id}", ValidUpdatePayload(suffix));
        var rawJson = await response.Content.ReadAsStringAsync();

        // THEN the JSON payload exposes camelCase keys matching the frontend's Cliente interface
        Assert.Contains("\"nombre\"", rawJson);
        Assert.Contains("\"nit\"", rawJson);
        Assert.Contains("\"telefono\"", rawJson);
        Assert.Contains("\"ciudad\"", rawJson);
    }

    // --- Edge cases (Story 2.4) --------------------------------------------------

    [Fact]
    public async Task PutClientes_WithMalformedGuidRouteSegment_ReturnsNotFoundNot500()
    {
        // GIVEN a route segment that is not a parseable GUID (route constraint is
        // `{id:guid}`)
        var client = _factory.CreateClient();

        // WHEN calling PUT /api/v1/clientes/not-a-guid
        var response = await client.PutAsJsonAsync("/api/v1/clientes/not-a-guid", ValidUpdatePayload("mg"));

        // THEN the request fails gracefully at routing/binding, never a 500
        Assert.NotEqual(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    [Fact]
    public async Task PutClientes_WithBodyIdDifferentFromRouteId_UsesRouteIdNotBodyId()
    {
        // GIVEN an existing seeded client, and a body whose (irrelevant) id field
        // would point elsewhere if it were trusted over the route
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var seeded = await SeedAsync($"Route Wins {suffix}", $"RW{suffix}");
        var client = _factory.CreateClient();

        // WHEN calling PUT /api/v1/clientes/{route-id} with a mismatched body id
        var response = await client.PutAsync($"/api/v1/clientes/{seeded.Id}",
            JsonContent.Create(new
            {
                id = Guid.NewGuid(),
                nombre = $"Cliente Route Wins {suffix}",
                nit = seeded.Nit,
                telefono = seeded.Telefono,
                ciudad = seeded.Ciudad,
            }));
        var updated = await response.Content.ReadFromJsonAsync<ClienteDto>();

        // THEN the route id wins — the client actually targeted by the route is updated
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(seeded.Id, updated!.Id);
    }
}
