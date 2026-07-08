using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Api;

/// <summary>
/// Story 2.3 — ATDD (RED phase).
///
/// Endpoint tests for <c>POST /api/v1/clientes</c> (Task 4). Covers:
///   * AC #9  — 201 Created + Location header + full ClienteDto body.
///   * AC #10 — 400 Bad Request with RFC 7807 ValidationProblem body,
///              camelCase field keys, Spanish messages, no leaks (NFR6).
///   * AC #11 — 409 Conflict with RFC 7807 Problem Details, Spanish detail,
///              no leaks (NFR6, R-001), and AddAsync never invoked.
///   * Persistence integration — the created row is visible on subsequent GETs.
///
/// Shares the same <see cref="WebApplicationFactory{TEntryPoint}"/> +
/// <c>UseEnvironment("Testing")</c> + fake-repository override pattern
/// established by Stories 2.1 and 2.2.
///
/// RED until the following are wired:
///   - POST endpoint on the /api/v1/clientes route group (Task 4)
///   - ValidationEndpointFilter&lt;CreateClienteRequest&gt;
///   - ExceptionHandlingMiddleware branch for ClienteNitConflictException
///   - CreateClienteCommandHandler is registered in DI
///   - IClienteRepository.AddAsync / NitExistsAsync are implemented
/// </summary>
public sealed class ClienteEndpointsCreateTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ClienteEndpointsCreateTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    private (WebApplicationFactory<Program> factory, FakeClienteRepository repo) FactoryWithFake(
        params string[] existingNits)
    {
        var fake = new FakeClienteRepository();
        foreach (var nit in existingNits)
        {
            fake.SeedExistingNit(nit);
        }

        var wrapped = _factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Testing");
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<IClienteRepository>();
                services.AddSingleton<IClienteRepository>(_ => fake);
            });
        });
        return (wrapped, fake);
    }

    // ─── 201 happy path (AC #9) ──────────────────────────────────────────

    [Fact]
    public async Task CreateCliente_Returns201_WithLocationHeader_AndDto_WhenBodyIsValid()
    {
        var (factory, _) = FactoryWithFake();
        using var _f = factory;
        using var client = factory.CreateClient();

        var body = new
        {
            nombre = "Acme SAS",
            nit = "900123456",
            telefono = "3001234567",
            ciudad = "Cali",
        };

        var response = await client.PostAsJsonAsync("/api/v1/clientes", body);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);

        Assert.NotNull(response.Headers.Location);
        var location = response.Headers.Location!.ToString();
        Assert.StartsWith("/api/v1/clientes/", location);

        var dto = await response.Content.ReadFromJsonAsync<ClienteResponse>();
        Assert.NotNull(dto);
        Assert.NotEqual(Guid.Empty, dto!.Id);
        Assert.Equal("Acme SAS", dto.Nombre);
        Assert.Equal("900123456", dto.Nit);
        Assert.Equal("3001234567", dto.Telefono);
        Assert.Equal("Cali", dto.Ciudad);

        // Location header ends with the created id.
        Assert.EndsWith($"/{dto.Id}", location);
    }

    // ─── 400 validation (AC #10) ─────────────────────────────────────────

    [Fact]
    public async Task CreateCliente_Returns400_WithValidationProblem_WhenBodyIsIncomplete()
    {
        var (factory, _) = FactoryWithFake();
        using var _f = factory;
        using var client = factory.CreateClient();

        var body = new { nombre = "", nit = "", telefono = "", ciudad = "" };

        var response = await client.PostAsJsonAsync("/api/v1/clientes", body);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
        Assert.StartsWith("application/problem+json", contentType);

        var raw = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(raw);
        Assert.Equal(400, doc.RootElement.GetProperty("status").GetInt32());
        Assert.True(doc.RootElement.TryGetProperty("errors", out var errors));

        // camelCase keys (AC #10).
        Assert.True(errors.TryGetProperty("nombre", out var nombreErrors));
        Assert.True(errors.TryGetProperty("nit", out var nitErrors));
        Assert.True(errors.TryGetProperty("telefono", out var telefonoErrors));
        Assert.True(errors.TryGetProperty("ciudad", out var ciudadErrors));

        // Spanish messages verbatim.
        Assert.Contains("El nombre es obligatorio", nombreErrors.EnumerateArray().Select(e => e.GetString()));
        Assert.Contains("El NIT/RUC es obligatorio", nitErrors.EnumerateArray().Select(e => e.GetString()));
        Assert.Contains("El teléfono es obligatorio", telefonoErrors.EnumerateArray().Select(e => e.GetString()));
        Assert.Contains("La ciudad es obligatoria", ciudadErrors.EnumerateArray().Select(e => e.GetString()));

        // PascalCase keys MUST NOT appear (Story asserts camelCase contract).
        Assert.DoesNotContain("\"Nombre\":", raw);
        Assert.DoesNotContain("\"Nit\":", raw);

        // NFR6 anti-leak.
        Assert.DoesNotContain("stackTrace", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("exception", raw, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CreateCliente_Returns400_WithSpecificField_WhenOnlyOneFieldMissing()
    {
        var (factory, _) = FactoryWithFake();
        using var _f = factory;
        using var client = factory.CreateClient();

        var body = new { nombre = "Ok", nit = "", telefono = "3000000000", ciudad = "Cali" };

        var response = await client.PostAsJsonAsync("/api/v1/clientes", body);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var raw = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(raw);
        var errors = doc.RootElement.GetProperty("errors");

        Assert.True(errors.TryGetProperty("nit", out var nitErrors));
        Assert.Contains("El NIT/RUC es obligatorio", nitErrors.EnumerateArray().Select(e => e.GetString()));

        Assert.False(errors.TryGetProperty("nombre", out _));
        Assert.False(errors.TryGetProperty("telefono", out _));
        Assert.False(errors.TryGetProperty("ciudad", out _));
    }

    // ─── 409 conflict (AC #11) ───────────────────────────────────────────

    [Fact]
    public async Task CreateCliente_Returns409_WithProblemDetails_WhenNitAlreadyExists()
    {
        var (factory, _) = FactoryWithFake("900123456");
        using var _f = factory;
        using var client = factory.CreateClient();

        var body = new
        {
            nombre = "Duplicated",
            nit = "900123456",
            telefono = "3009998877",
            ciudad = "Cali",
        };

        var response = await client.PostAsJsonAsync("/api/v1/clientes", body);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
        Assert.StartsWith("application/problem+json", contentType);

        var raw = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(raw);
        Assert.Equal("Conflict", doc.RootElement.GetProperty("title").GetString());
        Assert.Equal(409, doc.RootElement.GetProperty("status").GetInt32());
        Assert.Equal("El NIT/RUC ya está registrado", doc.RootElement.GetProperty("detail").GetString());

        // NFR6 / R-001 — no framework internals, no developer-facing message.
        Assert.DoesNotContain("stackTrace", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("exception", raw, StringComparison.OrdinalIgnoreCase);
        // Developer-facing exception message sentinel — must not leak.
        Assert.DoesNotContain("NIT '", raw);
        Assert.DoesNotContain("already exists", raw, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CreateCliente_Returns409_EvenWhen_AddAsyncNeverInvoked()
    {
        var (factory, repo) = FactoryWithFake("900123456");
        using var _f = factory;
        using var client = factory.CreateClient();

        var body = new
        {
            nombre = "Duplicated",
            nit = "900123456",
            telefono = "3009998877",
            ciudad = "Cali",
        };

        var response = await client.PostAsJsonAsync("/api/v1/clientes", body);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal(0, repo.AddAsyncCalls);
    }

    // ─── Persistence integration ─────────────────────────────────────────

    [Fact]
    public async Task CreateCliente_PersistsRow_ThatIsThenVisibleOnGet()
    {
        var (factory, _) = FactoryWithFake();
        using var _f = factory;
        using var client = factory.CreateClient();

        var body = new
        {
            nombre = "Persistable Corp",
            nit = "900777888",
            telefono = "3004440000",
            ciudad = "Barranquilla",
        };

        var createResponse = await client.PostAsJsonAsync("/api/v1/clientes", body);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var created = await createResponse.Content.ReadFromJsonAsync<ClienteResponse>();
        Assert.NotNull(created);

        var listResponse = await client.GetAsync("/api/v1/clientes");
        listResponse.EnsureSuccessStatusCode();
        var items = await listResponse.Content.ReadFromJsonAsync<List<ClienteResponse>>();

        Assert.NotNull(items);
        Assert.Contains(items!, e => e.Id == created!.Id && e.Nit == "900777888");
    }

    // ─── helpers ─────────────────────────────────────────────────────────

    private sealed record ClienteResponse(
        Guid Id, string Nombre, string Nit, string Telefono, string Ciudad,
        DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt);

    private sealed class FakeClienteRepository : IClienteRepository
    {
        private readonly HashSet<string> _existingNits = new(StringComparer.Ordinal);
        private readonly List<ClienteEntity> _items = new();

        public int AddAsyncCalls { get; private set; }
        public int NitExistsAsyncCalls { get; private set; }

        public void SeedExistingNit(string nit) => _existingNits.Add(nit);

        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult<IReadOnlyList<ClienteEntity>>(_items);

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromResult(_items.FirstOrDefault(e => e.Id == id));

        public Task AddAsync(ClienteEntity cliente, CancellationToken ct)
        {
            AddAsyncCalls += 1;
            _items.Add(cliente);
            _existingNits.Add(cliente.Nit);
            return Task.CompletedTask;
        }

        public Task<bool> NitExistsAsync(string nit, CancellationToken ct)
        {
            NitExistsAsyncCalls += 1;
            return Task.FromResult(_existingNits.Contains(nit));
        }

        // Story 2.4 additions — create-flow tests do not exercise updates.
        public Task UpdateAsync(ClienteEntity cliente, CancellationToken ct) => Task.CompletedTask;
        public Task<bool> NitExistsForAnotherAsync(Guid id, string nit, CancellationToken ct) => Task.FromResult(false);
    }
}
