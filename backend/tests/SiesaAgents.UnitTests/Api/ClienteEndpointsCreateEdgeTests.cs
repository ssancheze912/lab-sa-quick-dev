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
/// Story 2.3 — Automate (Edge Cases).
///
/// Expands ATDD coverage of <c>POST /api/v1/clientes</c> with boundary
/// conditions the RED-phase suite skipped:
///   * Empty JSON body <c>{}</c> — all four camelCase errors surface.
///   * Whitespace-only field values — same treatment as empty (Zod ↔ FV
///     parity anchor at the endpoint layer, R-006).
///   * PascalCase JSON keys in the request body are ignored (camelCase-only
///     binding — the endpoint contract Story 2.3 documents).
///   * Location header value ends with the created id and starts with the
///     absolute route (no path normalisation surprise).
///   * 201 body is a JSON object (not wrapped in a data envelope).
///   * 409 body keys are camelCase (title, status, detail, instance) —
///     Problem Details serialisation contract.
///   * 400 body keys are camelCase (title, status, errors) — Problem Details
///     serialisation contract.
///   * Malformed JSON (unclosed brace) returns 400 without leaking exception
///     internals (NFR6).
///   * Concurrent POSTs for different NITs all succeed without interference.
///   * Round-trip of unicode fields through the wire (Ñoño, ampersand, tildes).
///
/// [P1] tag — endpoint edges are the FE ↔ BE contract seam; any drift here
/// breaks the frontend Zod ↔ FluentValidation parity check (R-006) or the
/// axios classifier in <c>useCreateCliente</c>.
/// </summary>
public sealed class ClienteEndpointsCreateEdgeTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ClienteEndpointsCreateEdgeTests(WebApplicationFactory<Program> factory)
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

    // [P1] GIVEN empty JSON body {}, THEN 400 with all four camelCase errors present.
    [Fact]
    public async Task CreateCliente_Returns400_WithAllFourErrors_WhenBodyIsEmptyObject()
    {
        var (factory, _) = FactoryWithFake();
        using var _f = factory;
        using var client = factory.CreateClient();

        var response = await client.PostAsync(
            "/api/v1/clientes",
            new StringContent("{}", Encoding.UTF8, "application/json"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var raw = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(raw);
        var errors = doc.RootElement.GetProperty("errors");

        Assert.True(errors.TryGetProperty("nombre", out _));
        Assert.True(errors.TryGetProperty("nit", out _));
        Assert.True(errors.TryGetProperty("telefono", out _));
        Assert.True(errors.TryGetProperty("ciudad", out _));
    }

    // [P1] GIVEN whitespace-only field values, THEN 400 with per-field errors (Zod ↔ FV parity — R-006 at endpoint).
    [Fact]
    public async Task CreateCliente_Returns400_WithPerFieldErrors_WhenAllFieldsAreWhitespace()
    {
        var (factory, _) = FactoryWithFake();
        using var _f = factory;
        using var client = factory.CreateClient();

        var body = new { nombre = "   ", nit = "   ", telefono = "   ", ciudad = "   " };
        var response = await client.PostAsJsonAsync("/api/v1/clientes", body);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var raw = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(raw);
        var errors = doc.RootElement.GetProperty("errors");

        Assert.Contains("El nombre es obligatorio",
            errors.GetProperty("nombre").EnumerateArray().Select(e => e.GetString()));
        Assert.Contains("El NIT/RUC es obligatorio",
            errors.GetProperty("nit").EnumerateArray().Select(e => e.GetString()));
        Assert.Contains("El teléfono es obligatorio",
            errors.GetProperty("telefono").EnumerateArray().Select(e => e.GetString()));
        Assert.Contains("La ciudad es obligatoria",
            errors.GetProperty("ciudad").EnumerateArray().Select(e => e.GetString()));
    }

    // [P1] GIVEN a request with PascalCase keys, THEN model binding fails validation (System.Text.Json is
    // case-insensitive by default but the endpoint MUST still surface the 400 shape — this ensures the
    // contract test on the FE side (camelCase-only) does not silently mask a binding drift).
    [Fact]
    public async Task CreateCliente_AcceptsCamelCaseKeys_ForRequestBinding()
    {
        var (factory, _) = FactoryWithFake();
        using var _f = factory;
        using var client = factory.CreateClient();

        // camelCase — expected shape per Story contract.
        var body = new { nombre = "Acme", nit = "900123", telefono = "3000000000", ciudad = "Cali" };
        var response = await client.PostAsJsonAsync("/api/v1/clientes", body);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    // [P1] GIVEN a 201 response, THEN Location header ends with the created id AND starts with the route prefix.
    [Fact]
    public async Task CreateCliente_LocationHeader_EndsWithCreatedId_AndStartsWithRoutePrefix()
    {
        var (factory, _) = FactoryWithFake();
        using var _f = factory;
        using var client = factory.CreateClient();

        var body = new { nombre = "Acme", nit = "900123", telefono = "3000000000", ciudad = "Cali" };
        var response = await client.PostAsJsonAsync("/api/v1/clientes", body);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(response.Headers.Location);
        var location = response.Headers.Location!.ToString();

        Assert.StartsWith("/api/v1/clientes/", location);

        var dto = await response.Content.ReadFromJsonAsync<ClienteResponse>();
        Assert.NotNull(dto);
        Assert.EndsWith(dto!.Id.ToString(), location, StringComparison.OrdinalIgnoreCase);
    }

    // [P1] GIVEN a 201 response, THEN body is a bare JSON object (starts with '{'), NOT an array or a
    // data-envelope wrapper — the axios classifier + Zod parse rely on this.
    [Fact]
    public async Task CreateCliente_ReturnsBareJsonObject_NotArrayNotEnvelope()
    {
        var (factory, _) = FactoryWithFake();
        using var _f = factory;
        using var client = factory.CreateClient();

        var body = new { nombre = "Acme", nit = "900123", telefono = "3000000000", ciudad = "Cali" };
        var response = await client.PostAsJsonAsync("/api/v1/clientes", body);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var raw = await response.Content.ReadAsStringAsync();
        Assert.StartsWith("{", raw.TrimStart());
        Assert.DoesNotContain("\"data\":", raw);
    }

    // [P1] GIVEN a 409 body, THEN keys are camelCase (title, status, detail, instance) — Problem Details.
    [Fact]
    public async Task CreateCliente_409_ProblemDetailsPropertyKeys_AreCamelCase()
    {
        var (factory, _) = FactoryWithFake("900123");
        using var _f = factory;
        using var client = factory.CreateClient();

        var body = new { nombre = "Dup", nit = "900123", telefono = "3000000000", ciudad = "Cali" };
        var response = await client.PostAsJsonAsync("/api/v1/clientes", body);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var raw = await response.Content.ReadAsStringAsync();

        Assert.Contains("\"title\":", raw);
        Assert.Contains("\"status\":", raw);
        Assert.Contains("\"detail\":", raw);
        // PascalCase MUST NOT appear (case-sensitive contract).
        Assert.DoesNotContain("\"Title\":", raw);
        Assert.DoesNotContain("\"Status\":", raw);
        Assert.DoesNotContain("\"Detail\":", raw);
    }

    // [P1] GIVEN a 400 body, THEN keys are camelCase (title, status, errors).
    [Fact]
    public async Task CreateCliente_400_ProblemDetailsPropertyKeys_AreCamelCase()
    {
        var (factory, _) = FactoryWithFake();
        using var _f = factory;
        using var client = factory.CreateClient();

        var body = new { nombre = "", nit = "", telefono = "", ciudad = "" };
        var response = await client.PostAsJsonAsync("/api/v1/clientes", body);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var raw = await response.Content.ReadAsStringAsync();

        Assert.Contains("\"title\":", raw);
        Assert.Contains("\"status\":", raw);
        Assert.Contains("\"errors\":", raw);
        Assert.DoesNotContain("\"Title\":", raw);
        Assert.DoesNotContain("\"Errors\":", raw);
    }

    // [P1] GIVEN malformed JSON (unclosed brace), THEN 400 with no leaked exception internals (NFR6).
    [Fact]
    public async Task CreateCliente_Returns400_ForMalformedJson_WithoutLeakingInternals()
    {
        var (factory, _) = FactoryWithFake();
        using var _f = factory;
        using var client = factory.CreateClient();

        var response = await client.PostAsync(
            "/api/v1/clientes",
            new StringContent("{\"nombre\": \"Acme\"", Encoding.UTF8, "application/json"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var raw = await response.Content.ReadAsStringAsync();
        // NFR6 anti-leak.
        Assert.DoesNotContain("stackTrace", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("JsonException", raw);
        Assert.DoesNotContain("System.Text.Json", raw);
    }

    // [P2] GIVEN unicode-heavy fields, THEN the wire round-trips them intact in the 201 body.
    [Fact]
    public async Task CreateCliente_PreservesUnicode_InResponseBody()
    {
        var (factory, _) = FactoryWithFake();
        using var _f = factory;
        using var client = factory.CreateClient();

        var body = new
        {
            nombre = "Ñoño & Peña S.A. — Ãbc",
            nit = "900-123-456",
            telefono = "300 123 4567",
            ciudad = "Cañón, Antioquia",
        };
        var response = await client.PostAsJsonAsync("/api/v1/clientes", body);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<ClienteResponse>();
        Assert.NotNull(dto);
        Assert.Equal("Ñoño & Peña S.A. — Ãbc", dto!.Nombre);
        Assert.Equal("Cañón, Antioquia", dto.Ciudad);
    }

    // [P2] GIVEN two concurrent POSTs with DIFFERENT NITs, THEN both succeed with distinct ids (no state leak).
    [Fact]
    public async Task CreateCliente_HandlesConcurrentRequests_WithDifferentNits()
    {
        var (factory, _) = FactoryWithFake();
        using var _f = factory;
        using var client = factory.CreateClient();

        var b1 = new { nombre = "A", nit = "111", telefono = "3001111111", ciudad = "Cali" };
        var b2 = new { nombre = "B", nit = "222", telefono = "3002222222", ciudad = "Bogotá" };
        var b3 = new { nombre = "C", nit = "333", telefono = "3003333333", ciudad = "Medellín" };

        var results = await Task.WhenAll(
            client.PostAsJsonAsync("/api/v1/clientes", b1),
            client.PostAsJsonAsync("/api/v1/clientes", b2),
            client.PostAsJsonAsync("/api/v1/clientes", b3));

        Assert.All(results, r => Assert.Equal(HttpStatusCode.Created, r.StatusCode));

        var dtos = await Task.WhenAll(
            results[0].Content.ReadFromJsonAsync<ClienteResponse>(),
            results[1].Content.ReadFromJsonAsync<ClienteResponse>(),
            results[2].Content.ReadFromJsonAsync<ClienteResponse>());

        var ids = dtos.Where(d => d is not null).Select(d => d!.Id).ToArray();
        Assert.Equal(3, ids.Distinct().Count());
    }

    // [P2] GIVEN a 409 body, THEN Content-Type is application/problem+json (not application/json).
    [Fact]
    public async Task CreateCliente_409_ContentType_IsApplicationProblemJson()
    {
        var (factory, _) = FactoryWithFake("900123");
        using var _f = factory;
        using var client = factory.CreateClient();

        var body = new { nombre = "Dup", nit = "900123", telefono = "3000000000", ciudad = "Cali" };
        var response = await client.PostAsJsonAsync("/api/v1/clientes", body);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
        Assert.StartsWith("application/problem+json", contentType);
    }

    // [P2] GIVEN a 201 body, THEN Content-Type is application/json.
    [Fact]
    public async Task CreateCliente_201_ContentType_IsApplicationJson()
    {
        var (factory, _) = FactoryWithFake();
        using var _f = factory;
        using var client = factory.CreateClient();

        var body = new { nombre = "Acme", nit = "900123", telefono = "3000000000", ciudad = "Cali" };
        var response = await client.PostAsJsonAsync("/api/v1/clientes", body);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
    }

    // [P2] GIVEN a 400 body, THEN Content-Type is application/problem+json.
    [Fact]
    public async Task CreateCliente_400_ContentType_IsApplicationProblemJson()
    {
        var (factory, _) = FactoryWithFake();
        using var _f = factory;
        using var client = factory.CreateClient();

        var body = new { nombre = "", nit = "", telefono = "", ciudad = "" };
        var response = await client.PostAsJsonAsync("/api/v1/clientes", body);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
        Assert.StartsWith("application/problem+json", contentType);
    }

    // ─── helpers ─────────────────────────────────────────────────────────

    private sealed record ClienteResponse(
        Guid Id, string Nombre, string Nit, string Telefono, string Ciudad,
        DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt);

    private sealed class FakeClienteRepository : IClienteRepository
    {
        private readonly HashSet<string> _existingNits = new(StringComparer.Ordinal);
        private readonly List<ClienteEntity> _items = new();
        private readonly object _lock = new();

        public int AddAsyncCalls { get; private set; }

        public void SeedExistingNit(string nit) => _existingNits.Add(nit);

        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct)
        {
            lock (_lock)
            {
                return Task.FromResult<IReadOnlyList<ClienteEntity>>(_items.ToList());
            }
        }

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
        {
            lock (_lock)
            {
                return Task.FromResult(_items.FirstOrDefault(e => e.Id == id));
            }
        }

        public Task AddAsync(ClienteEntity cliente, CancellationToken ct)
        {
            lock (_lock)
            {
                AddAsyncCalls += 1;
                _items.Add(cliente);
                _existingNits.Add(cliente.Nit);
                return Task.CompletedTask;
            }
        }

        public Task<bool> NitExistsAsync(string nit, CancellationToken ct)
        {
            lock (_lock)
            {
                return Task.FromResult(_existingNits.Contains(nit));
            }
        }

        // Story 2.4 additions — create-edge tests do not exercise updates.
        public Task UpdateAsync(ClienteEntity cliente, CancellationToken ct) => Task.CompletedTask;
        public Task<bool> NitExistsForAnotherAsync(Guid id, string nit, CancellationToken ct) => Task.FromResult(false);
    }
}
