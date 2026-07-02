// -----------------------------------------------------------------------------
//  Story 2.1 — Client List & Search
//  Integration tests for GET /api/v1/clientes (AC #8, #5).
//
//  Sandbox note: the local environment has no Docker (per test-design R-013
//  fallback), so this suite swaps the Npgsql-backed AppDbContext for the EF
//  Core InMemory provider inside a per-test factory. This exercises the full
//  Minimal API + CQRS + repository pipeline end-to-end while remaining
//  Docker-less. Testcontainers-backed migrations coverage lives in
//  MigrationsAndSnakeCaseTests.
// -----------------------------------------------------------------------------
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests;

public class InMemoryDbWebApplicationFactory : WebApplicationFactory<Program>
{
    public string DatabaseName { get; } = $"clientes-tests-{Guid.NewGuid()}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Force a known environment so appsettings.Testing.json is loaded (with a
        // valid stub connection string for Program.cs startup validation).
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            // Strip every EF Core service registration so the Npgsql provider that
            // Program.cs wired up is completely removed. Otherwise EF refuses to
            // register a second provider inside the same service provider.
            var toRemove = services
                .Where(d =>
                    d.ServiceType == typeof(DbContextOptions<AppDbContext>) ||
                    d.ServiceType == typeof(DbContextOptions) ||
                    d.ServiceType == typeof(AppDbContext) ||
                    (d.ServiceType.FullName?.StartsWith("Microsoft.EntityFrameworkCore", StringComparison.Ordinal) ?? false) ||
                    (d.ServiceType.FullName?.StartsWith("Npgsql", StringComparison.Ordinal) ?? false))
                .ToList();

            foreach (var descriptor in toRemove)
            {
                services.Remove(descriptor);
            }

            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase(DatabaseName));
        });
    }
}

[Trait("Category", "Integration")]
public class ClienteEndpointsTests : IClassFixture<InMemoryDbWebApplicationFactory>
{
    private readonly InMemoryDbWebApplicationFactory _factory;

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public ClienteEndpointsTests(InMemoryDbWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private async Task ResetAndSeedAsync(params ClienteEntity[] clientes)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Clientes.RemoveRange(db.Clientes);
        if (clientes.Length > 0)
        {
            await db.Clientes.AddRangeAsync(clientes);
        }
        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task GetClientes_WhenEmpty_Returns200WithEmptyArray()
    {
        await ResetAndSeedAsync();
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/v1/clientes");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);

        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        Assert.Equal(0, doc.RootElement.GetArrayLength());
    }

    [Fact]
    public async Task GetClientes_WithSeededData_Returns200WithClienteDtoShape()
    {
        var acme = ClienteEntity.Create("Acme Corp", "900123456-7", "+57 300 111 1111", "Cali");
        var beta = ClienteEntity.Create("Beta Ltda", "800987654-3", "+57 301 222 2222", "Bogotá");
        var gamma = ClienteEntity.Create("Gamma Industrial", "901234567-8", "+57 302 333 3333", "Medellín");

        await ResetAndSeedAsync(acme, beta, gamma);
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/v1/clientes");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var dtos = await response.Content.ReadFromJsonAsync<List<ClienteDto>>(JsonOptions);
        Assert.NotNull(dtos);
        Assert.Equal(3, dtos!.Count);

        var acmeDto = dtos.Single(d => d.Nombre == "Acme Corp");
        Assert.Equal("900123456-7", acmeDto.Nit);
        Assert.Equal("+57 300 111 1111", acmeDto.Telefono);
        Assert.Equal("Cali", acmeDto.Ciudad);
        Assert.NotEqual(Guid.Empty, acmeDto.Id);
    }

    [Fact]
    public async Task GetClientes_ReturnsCamelCaseJsonKeys()
    {
        var cliente = ClienteEntity.Create("Delta", "900000000-1", "+57 000", "Cali");
        await ResetAndSeedAsync(cliente);
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/v1/clientes");
        var body = await response.Content.ReadAsStringAsync();

        // camelCase keys per Program.cs JsonOptions
        Assert.Contains("\"id\"", body);
        Assert.Contains("\"nombre\"", body);
        Assert.Contains("\"createdAt\"", body);
        Assert.Contains("\"updatedAt\"", body);
        // No PascalCase leaks
        Assert.DoesNotContain("\"Id\"", body);
        Assert.DoesNotContain("\"Nombre\"", body);
        Assert.DoesNotContain("\"CreatedAt\"", body);
    }

    [Fact]
    public async Task GetClientes_UnknownSubroute_DoesNotLeakStackTrace()
    {
        await ResetAndSeedAsync();
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/v1/clientes/not-a-valid-id-xyz");
        var body = await response.Content.ReadAsStringAsync();

        // NFR6 — no C# stack trace / EF Core internals / async state machine frames.
        Assert.DoesNotMatch(new System.Text.RegularExpressions.Regex(@"at [A-Za-z_.]+\+?<[A-Za-z_>]+>[a-z0-9_]+"), body);
        Assert.DoesNotContain("System.InvalidOperationException", body);
        Assert.DoesNotContain("Microsoft.EntityFrameworkCore", body);
        Assert.DoesNotContain(".cs:line", body);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Story 2.2 — GET /api/v1/clientes/{id:guid}
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetClienteById_ExistingId_Returns200WithDto()
    {
        var acme = ClienteEntity.Create("Acme Corp", "900123456-7", "+57 300 111 1111", "Cali");
        await ResetAndSeedAsync(acme);
        var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/v1/clientes/{acme.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);

        var dto = await response.Content.ReadFromJsonAsync<ClienteDto>(JsonOptions);
        Assert.NotNull(dto);
        Assert.Equal(acme.Id, dto!.Id);
        Assert.Equal("Acme Corp", dto.Nombre);
        Assert.Equal("900123456-7", dto.Nit);
        Assert.Equal("+57 300 111 1111", dto.Telefono);
        Assert.Equal("Cali", dto.Ciudad);

        var followUp = await client.GetAsync($"/api/v1/clientes/{acme.Id}");
        var body = await followUp.Content.ReadAsStringAsync();
        // camelCase keys — no PascalCase leak from .NET serialization.
        Assert.Contains("\"id\"", body);
        Assert.Contains("\"nombre\"", body);
        Assert.Contains("\"createdAt\"", body);
        Assert.DoesNotContain("\"Id\"", body);
        Assert.DoesNotContain("\"Nombre\"", body);
        Assert.DoesNotContain("\"CreatedAt\"", body);
    }

    [Fact]
    public async Task GetClienteById_UnknownId_Returns404ProblemDetails()
    {
        await ResetAndSeedAsync();
        var client = _factory.CreateClient();
        var unknownId = Guid.NewGuid();

        var response = await client.GetAsync($"/api/v1/clientes/{unknownId}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal(
            "application/problem+json",
            response.Content.Headers.ContentType?.MediaType);

        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.Equal("Cliente no encontrado", doc.RootElement.GetProperty("title").GetString());
        Assert.Equal(404, doc.RootElement.GetProperty("status").GetInt32());
        Assert.Contains($"/api/v1/clientes/{unknownId}", doc.RootElement.GetProperty("instance").GetString());

        // NFR6 — no internal signal leaks in the 404 body.
        Assert.DoesNotContain("System.", body);
        Assert.DoesNotContain("Microsoft.EntityFrameworkCore", body);
        Assert.DoesNotContain(".cs:line", body);
    }

    [Fact]
    public async Task GetClienteById_InvalidGuid_ReturnsClientErrorWithoutStackTrace()
    {
        await ResetAndSeedAsync();
        var client = _factory.CreateClient();

        // Route constraint {id:guid} refuses to bind — framework produces a 4xx.
        var response = await client.GetAsync("/api/v1/clientes/not-a-guid");
        var body = await response.Content.ReadAsStringAsync();

        // Must be a 4xx, not a 5xx (no unhandled exception path).
        Assert.True((int)response.StatusCode >= 400 && (int)response.StatusCode < 500,
            $"Expected 4xx status; got {(int)response.StatusCode}.");

        // NFR6 — no C# / EF Core / stack trace signals in the response body.
        Assert.DoesNotContain("System.InvalidOperationException", body);
        Assert.DoesNotContain("Microsoft.EntityFrameworkCore", body);
        Assert.DoesNotContain(".cs:line", body);
    }

    [Fact]
    public async Task GetClienteById_UnknownId_DoesNotLeakStackTrace()
    {
        await ResetAndSeedAsync();
        var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/v1/clientes/{Guid.NewGuid()}");
        var body = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.DoesNotMatch(new System.Text.RegularExpressions.Regex(@"at [A-Za-z_.]+\+?<[A-Za-z_>]+>[a-z0-9_]+"), body);
        Assert.DoesNotContain("System.InvalidOperationException", body);
        Assert.DoesNotContain("Microsoft.EntityFrameworkCore", body);
        Assert.DoesNotContain(".cs:line", body);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Story 2.2 — Edge cases / expansions (automate pass)
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetClienteById_MultipleSeeded_ReturnsOnlyTheRequestedOne()
    {
        // GIVEN: Three clientes are seeded and we request just the second one.
        var acme = ClienteEntity.Create("Acme Corp", "900123456-7", "+57 300 111 1111", "Cali");
        var beta = ClienteEntity.Create("Beta Ltda", "800987654-3", "+57 301 222 2222", "Bogotá");
        var gamma = ClienteEntity.Create("Gamma Industrial", "901234567-8", "+57 302 333 3333", "Medellín");
        await ResetAndSeedAsync(acme, beta, gamma);
        var client = _factory.CreateClient();

        // WHEN: GET /api/v1/clientes/{betaId}
        var response = await client.GetAsync($"/api/v1/clientes/{beta.Id}");

        // THEN: Only Beta comes back — not an array, not Acme, not Gamma.
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<ClienteDto>(JsonOptions);
        Assert.NotNull(dto);
        Assert.Equal(beta.Id, dto!.Id);
        Assert.Equal("Beta Ltda", dto.Nombre);
        Assert.NotEqual(acme.Id, dto.Id);
        Assert.NotEqual(gamma.Id, dto.Id);
    }

    [Fact]
    public async Task GetClienteById_UnknownId_ProblemDetails_ContainsRfc7807TypeField()
    {
        // GIVEN: An empty DB and a random unknown id
        await ResetAndSeedAsync();
        var client = _factory.CreateClient();
        var unknownId = Guid.NewGuid();

        // WHEN: GET /api/v1/clientes/{unknownId}
        var response = await client.GetAsync($"/api/v1/clientes/{unknownId}");
        var body = await response.Content.ReadAsStringAsync();

        // THEN: The Problem Details JSON exposes the RFC 7807 shape (title,
        // status, instance) AND the `type` field wired in the endpoint —
        // NFR6 forbids swapping this contract for a raw error string.
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        using var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("type", out var typeElem),
            $"Problem Details response is missing the 'type' member. Body: {body}");
        Assert.False(string.IsNullOrWhiteSpace(typeElem.GetString()));
        Assert.Equal("Cliente no encontrado", doc.RootElement.GetProperty("title").GetString());
        Assert.Equal(404, doc.RootElement.GetProperty("status").GetInt32());
    }

    [Fact]
    public async Task GetClienteById_UppercaseGuidInPath_Returns200SameAsLowercase()
    {
        // GIVEN: A seeded cliente
        var acme = ClienteEntity.Create("Acme Corp", "900123456-7", "+57 300 111 1111", "Cali");
        await ResetAndSeedAsync(acme);
        var client = _factory.CreateClient();

        // WHEN: The path uses the UPPERCASE guid representation
        var upperId = acme.Id.ToString().ToUpperInvariant();
        var response = await client.GetAsync($"/api/v1/clientes/{upperId}");

        // THEN: The framework's `{id:guid}` constraint parses case-insensitively
        // and the handler returns the same DTO as with lowercase.
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<ClienteDto>(JsonOptions);
        Assert.NotNull(dto);
        Assert.Equal(acme.Id, dto!.Id);
        Assert.Equal("Acme Corp", dto.Nombre);
    }

    [Fact]
    public async Task GetClienteById_UnknownId_ProblemDetails_HasApplicationProblemJsonContentType()
    {
        // GIVEN: An empty DB and a random unknown id
        await ResetAndSeedAsync();
        var client = _factory.CreateClient();

        // WHEN: GET /api/v1/clientes/{unknownId}
        var response = await client.GetAsync($"/api/v1/clientes/{Guid.NewGuid()}");

        // THEN: The response advertises `application/problem+json` per RFC 7807 —
        // frontend uses this Content-Type to route responses through the
        // Problem-Details decoder (never rendered raw to the user, NFR6).
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal(
            "application/problem+json",
            response.Content.Headers.ContentType?.MediaType);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Story 2.3 — POST /api/v1/clientes (create)
    //
    // NOTE (sandbox constraint): EF Core InMemory 10 does NOT enforce unique
    // indexes on SaveChangesAsync — it silently persists duplicates. The
    // "true" 409 code path (DbUpdateException with PostgresException 23505 →
    // DuplicateNitException) is exercised by unit tests
    // (CreateClienteCommandHandlerTests) using synthetic PostgresException
    // instances. The E2E API contract test (story-2.3-create-client.api.spec.ts)
    // covers it against a real PostgreSQL instance when one is available.
    // ─────────────────────────────────────────────────────────────────────

    private sealed record CreateClientePayload(
        string Nombre,
        string Nit,
        string Telefono,
        string Ciudad);

    [Fact]
    public async Task CreateCliente_ValidPayload_Returns201WithDtoAndLocation()
    {
        await ResetAndSeedAsync();
        var client = _factory.CreateClient();

        var payload = new CreateClientePayload(
            "Nuevo Cliente",
            $"999888777-{Guid.NewGuid().ToString().AsSpan(0, 4).ToString()}",
            "+57 300 555 0000",
            "Cali");

        var response = await client.PostAsJsonAsync("/api/v1/clientes", payload);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var location = response.Headers.Location?.ToString();
        Assert.NotNull(location);
        Assert.Contains("/api/v1/clientes/", location);

        var dto = await response.Content.ReadFromJsonAsync<ClienteDto>(JsonOptions);
        Assert.NotNull(dto);
        Assert.NotEqual(Guid.Empty, dto!.Id);
        Assert.Equal(payload.Nombre, dto.Nombre);
        Assert.Equal(payload.Nit, dto.Nit);
        Assert.Equal(payload.Telefono, dto.Telefono);
        Assert.Equal(payload.Ciudad, dto.Ciudad);

        // Round-trip: fetch via GET on the Location and confirm identity.
        var followUp = await client.GetAsync(location);
        Assert.Equal(HttpStatusCode.OK, followUp.StatusCode);
        var again = await followUp.Content.ReadFromJsonAsync<ClienteDto>(JsonOptions);
        Assert.NotNull(again);
        Assert.Equal(dto.Id, again!.Id);
    }

    [Fact]
    public async Task CreateCliente_EmptyNombre_Returns400ProblemDetails()
    {
        await ResetAndSeedAsync();
        var client = _factory.CreateClient();

        var payload = new CreateClientePayload(string.Empty, "900-1", "+57 300", "Cali");

        var response = await client.PostAsJsonAsync("/api/v1/clientes", payload);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("errors", out var errors));
        Assert.True(errors.TryGetProperty("nombre", out _));
        Assert.Equal(400, doc.RootElement.GetProperty("status").GetInt32());

        // NFR6 — no stack trace signals.
        Assert.DoesNotContain("System.", body);
        Assert.DoesNotContain("Microsoft.EntityFrameworkCore", body);
        Assert.DoesNotContain(".cs:line", body);
    }

    [Fact]
    public async Task CreateCliente_WhitespaceOnlyFields_Returns400WithAllFieldErrors()
    {
        await ResetAndSeedAsync();
        var client = _factory.CreateClient();

        var payload = new CreateClientePayload("   ", "\t  ", "  ", " \n ");

        var response = await client.PostAsJsonAsync("/api/v1/clientes", payload);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var errors = doc.RootElement.GetProperty("errors");

        Assert.True(errors.TryGetProperty("nombre", out _));
        Assert.True(errors.TryGetProperty("nit", out _));
        Assert.True(errors.TryGetProperty("telefono", out _));
        Assert.True(errors.TryGetProperty("ciudad", out _));
    }

    [Fact]
    public async Task CreateCliente_NitExceedsMaxLength_Returns400()
    {
        await ResetAndSeedAsync();
        var client = _factory.CreateClient();

        var payload = new CreateClientePayload(
            "Nuevo Cliente",
            new string('A', 51),
            "+57 300",
            "Cali");

        var response = await client.PostAsJsonAsync("/api/v1/clientes", payload);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.GetProperty("errors").TryGetProperty("nit", out _));
    }

    [Fact]
    public async Task CreateCliente_TrimsFieldsBeforePersist()
    {
        await ResetAndSeedAsync();
        var client = _factory.CreateClient();

        var payload = new CreateClientePayload(
            "  Trimmed Cliente  ",
            $"  900-{Guid.NewGuid().ToString().AsSpan(0, 4).ToString()}  ",
            "  +57 300 000 0000  ",
            "  Cali  ");

        var response = await client.PostAsJsonAsync("/api/v1/clientes", payload);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<ClienteDto>(JsonOptions);
        Assert.NotNull(dto);
        Assert.Equal("Trimmed Cliente", dto!.Nombre);
        Assert.Equal(payload.Nit.Trim(), dto.Nit);
        Assert.Equal("+57 300 000 0000", dto.Telefono);
        Assert.Equal("Cali", dto.Ciudad);
    }

    [Fact]
    public async Task CreateCliente_ResponseUsesCamelCaseKeys()
    {
        await ResetAndSeedAsync();
        var client = _factory.CreateClient();

        var payload = new CreateClientePayload(
            "Cliente Camel",
            $"900-{Guid.NewGuid().ToString().AsSpan(0, 4).ToString()}",
            "+57 300",
            "Cali");

        var response = await client.PostAsJsonAsync("/api/v1/clientes", payload);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("\"id\"", body);
        Assert.Contains("\"nombre\"", body);
        Assert.Contains("\"createdAt\"", body);
        Assert.DoesNotContain("\"Id\"", body);
        Assert.DoesNotContain("\"Nombre\"", body);
        Assert.DoesNotContain("\"CreatedAt\"", body);
    }
}
