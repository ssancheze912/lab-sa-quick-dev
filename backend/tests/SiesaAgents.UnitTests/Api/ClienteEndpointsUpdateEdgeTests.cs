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
/// Story 2.4 — Automate (Edge Cases).
///
/// Expands ATDD coverage of <c>PUT /api/v1/clientes/{id:guid}</c> with boundary
/// conditions the RED-phase suite skipped:
///   * Empty JSON body <c>{}</c> — all four camelCase errors surface.
///   * Whitespace-only field values — same treatment as empty (Zod ↔ FV
///     parity anchor at the endpoint layer, R-006).
///   * Malformed JSON returns 400 without leaking exception internals (NFR6).
///   * Content-Type headers: 200 → application/json; 400/404/409 →
///     application/problem+json.
///   * 400 body keys are camelCase (title, status, errors) — Problem Details
///     serialisation contract.
///   * 409 body keys are camelCase (title, status, detail, instance) — Problem
///     Details serialisation contract.
///   * 200 body is a bare JSON object (no data-envelope wrapper).
///   * Unicode fields round-trip through the wire on 200.
///   * <c>createdAt</c> byte-for-byte preserved across the PUT + GET round
///     trip (audit-trail immutability, AC #9).
///   * Extra unknown fields in the body are ignored (System.Text.Json default
///     is <c>JsonUnknownTypeHandling.JsonElement</c>-style — properties without
///     a match are dropped rather than throwing).
///   * PUT to a non-Guid path (e.g. <c>abc</c>, <c>123</c>, empty) → 404 from
///     the route constraint.
///   * Concurrent PUTs on DIFFERENT rows all succeed cleanly (no state leak
///     between requests).
///   * 500 path — an unexpected repository failure surfaces as 500 with no
///     leaked exception internals (NFR6).
///
/// [P1] tag — endpoint edges are the FE ↔ BE contract seam; any drift here
/// breaks the axios classifier in <c>useUpdateCliente</c> or the R-006 parity
/// check with Zod.
/// </summary>
public sealed class ClienteEndpointsUpdateEdgeTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ClienteEndpointsUpdateEdgeTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    private (WebApplicationFactory<Program> factory, FakeClienteRepository repo) FactoryWithFake(
        params ClienteEntity[] seed)
    {
        var fake = new FakeClienteRepository();
        foreach (var e in seed)
        {
            fake.SeedEntity(e);
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

    private WebApplicationFactory<Program> FactoryWithRepo(IClienteRepository repo)
    {
        return _factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Testing");
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<IClienteRepository>();
                services.AddSingleton(repo);
            });
        });
    }

    // ─── 400 edge cases (AC #10) ─────────────────────────────────────────

    // [P1] GIVEN an empty JSON body {}, THEN 400 surfaces with all four camelCase errors.
    [Fact]
    public async Task UpdateCliente_Returns400_WithAllFourErrors_WhenBodyIsEmptyObject()
    {
        var seeded = ClienteEntity.Create("Old Name", "900111000", "3000000000", "Bogotá");
        var (factory, _) = FactoryWithFake(seeded);
        using var _f = factory;
        using var client = factory.CreateClient();

        var response = await client.PutAsync(
            $"/api/v1/clientes/{seeded.Id}",
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

    // [P1] GIVEN whitespace-only values, THEN 400 with per-field errors (Zod ↔ FV parity anchor, R-006).
    [Fact]
    public async Task UpdateCliente_Returns400_WithPerFieldErrors_WhenAllFieldsAreWhitespace()
    {
        var seeded = ClienteEntity.Create("Old Name", "900111000", "3000000000", "Bogotá");
        var (factory, _) = FactoryWithFake(seeded);
        using var _f = factory;
        using var client = factory.CreateClient();

        var body = new { nombre = "   ", nit = "   ", telefono = "   ", ciudad = "   " };
        var response = await client.PutAsJsonAsync($"/api/v1/clientes/{seeded.Id}", body);

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

    // [P1] GIVEN malformed JSON (unclosed brace), THEN 400 with no leaked exception internals (NFR6).
    [Fact]
    public async Task UpdateCliente_Returns400_ForMalformedJson_WithoutLeakingInternals()
    {
        var seeded = ClienteEntity.Create("Old Name", "900111000", "3000000000", "Bogotá");
        var (factory, _) = FactoryWithFake(seeded);
        using var _f = factory;
        using var client = factory.CreateClient();

        var response = await client.PutAsync(
            $"/api/v1/clientes/{seeded.Id}",
            new StringContent("{\"nombre\": \"Acme\"", Encoding.UTF8, "application/json"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var raw = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("stackTrace", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("JsonException", raw);
        Assert.DoesNotContain("System.Text.Json", raw);
    }

    // [P1] GIVEN a 400 body, THEN Problem Details keys are camelCase (title, status, errors).
    [Fact]
    public async Task UpdateCliente_400_ProblemDetailsPropertyKeys_AreCamelCase()
    {
        var seeded = ClienteEntity.Create("Old Name", "900111000", "3000000000", "Bogotá");
        var (factory, _) = FactoryWithFake(seeded);
        using var _f = factory;
        using var client = factory.CreateClient();

        var body = new { nombre = "", nit = "", telefono = "", ciudad = "" };
        var response = await client.PutAsJsonAsync($"/api/v1/clientes/{seeded.Id}", body);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var raw = await response.Content.ReadAsStringAsync();

        Assert.Contains("\"title\":", raw);
        Assert.Contains("\"status\":", raw);
        Assert.Contains("\"errors\":", raw);
        Assert.DoesNotContain("\"Title\":", raw);
        Assert.DoesNotContain("\"Status\":", raw);
        Assert.DoesNotContain("\"Errors\":", raw);
    }

    // [P2] GIVEN a 400 body, THEN Content-Type is application/problem+json.
    [Fact]
    public async Task UpdateCliente_400_ContentType_IsApplicationProblemJson()
    {
        var seeded = ClienteEntity.Create("Old Name", "900111000", "3000000000", "Bogotá");
        var (factory, _) = FactoryWithFake(seeded);
        using var _f = factory;
        using var client = factory.CreateClient();

        var body = new { nombre = "", nit = "", telefono = "", ciudad = "" };
        var response = await client.PutAsJsonAsync($"/api/v1/clientes/{seeded.Id}", body);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
        Assert.StartsWith("application/problem+json", contentType);
    }

    // ─── 409 edge cases (AC #12) ─────────────────────────────────────────

    // [P1] GIVEN a 409 body, THEN Problem Details keys are camelCase (title, status, detail).
    [Fact]
    public async Task UpdateCliente_409_ProblemDetailsPropertyKeys_AreCamelCase()
    {
        var rowA = ClienteEntity.Create("Alpha", "900000900", "3000000000", "Bogotá");
        var rowB = ClienteEntity.Create("Beta", "800000800", "3000000000", "Bogotá");
        var (factory, _) = FactoryWithFake(rowA, rowB);
        using var _f = factory;
        using var client = factory.CreateClient();

        var body = new
        {
            nombre = "Alpha",
            nit = "800000800",
            telefono = "3000000000",
            ciudad = "Bogotá",
        };
        var response = await client.PutAsJsonAsync($"/api/v1/clientes/{rowA.Id}", body);

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

    // [P2] GIVEN a 409 body, THEN Content-Type is application/problem+json.
    [Fact]
    public async Task UpdateCliente_409_ContentType_IsApplicationProblemJson()
    {
        var rowA = ClienteEntity.Create("Alpha", "900000900", "3000000000", "Bogotá");
        var rowB = ClienteEntity.Create("Beta", "800000800", "3000000000", "Bogotá");
        var (factory, _) = FactoryWithFake(rowA, rowB);
        using var _f = factory;
        using var client = factory.CreateClient();

        var body = new
        {
            nombre = "Alpha",
            nit = "800000800",
            telefono = "3000000000",
            ciudad = "Bogotá",
        };
        var response = await client.PutAsJsonAsync($"/api/v1/clientes/{rowA.Id}", body);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
        Assert.StartsWith("application/problem+json", contentType);
    }

    // ─── 200 edge cases (AC #9) ──────────────────────────────────────────

    // [P1] GIVEN a 200 body, THEN it is a bare JSON object (no data-envelope wrapper).
    [Fact]
    public async Task UpdateCliente_ReturnsBareJsonObject_NotArrayNotEnvelope()
    {
        var seeded = ClienteEntity.Create("Old Name", "900111000", "3000000000", "Bogotá");
        var (factory, _) = FactoryWithFake(seeded);
        using var _f = factory;
        using var client = factory.CreateClient();

        var body = new
        {
            nombre = "New Name",
            nit = "900111000",
            telefono = "3009998877",
            ciudad = "Cali",
        };
        var response = await client.PutAsJsonAsync($"/api/v1/clientes/{seeded.Id}", body);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var raw = await response.Content.ReadAsStringAsync();
        Assert.StartsWith("{", raw.TrimStart());
        Assert.DoesNotContain("\"data\":", raw);
    }

    // [P2] GIVEN a 200 body, THEN Content-Type is application/json (not problem+json).
    [Fact]
    public async Task UpdateCliente_200_ContentType_IsApplicationJson()
    {
        var seeded = ClienteEntity.Create("Old Name", "900111000", "3000000000", "Bogotá");
        var (factory, _) = FactoryWithFake(seeded);
        using var _f = factory;
        using var client = factory.CreateClient();

        var body = new
        {
            nombre = "New Name",
            nit = "900111000",
            telefono = "3009998877",
            ciudad = "Cali",
        };
        var response = await client.PutAsJsonAsync($"/api/v1/clientes/{seeded.Id}", body);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
    }

    // [P1] GIVEN unicode-heavy fields, THEN the wire round-trips them intact in the 200 body.
    [Fact]
    public async Task UpdateCliente_PreservesUnicode_InResponseBody()
    {
        var seeded = ClienteEntity.Create("Old", "900000000", "3000000000", "Cali");
        var (factory, _) = FactoryWithFake(seeded);
        using var _f = factory;
        using var client = factory.CreateClient();

        var body = new
        {
            nombre = "Ñoño & Peña S.A. — Ãbc",
            nit = "900-123-456",
            telefono = "300 123 4567",
            ciudad = "Cañón, Antioquia",
        };
        var response = await client.PutAsJsonAsync($"/api/v1/clientes/{seeded.Id}", body);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<ClienteResponse>();
        Assert.NotNull(dto);
        Assert.Equal("Ñoño & Peña S.A. — Ãbc", dto!.Nombre);
        Assert.Equal("900-123-456", dto.Nit);
        Assert.Equal("300 123 4567", dto.Telefono);
        Assert.Equal("Cañón, Antioquia", dto.Ciudad);
    }

    // [P1] GIVEN a PUT, THEN CreatedAt is byte-for-byte identical between the response and a subsequent GET.
    [Fact]
    public async Task UpdateCliente_PreservesCreatedAt_AcrossPutThenGet()
    {
        var seeded = ClienteEntity.Create("Old Name", "900111000", "3000000000", "Bogotá");
        var (factory, _) = FactoryWithFake(seeded);
        using var _f = factory;
        using var client = factory.CreateClient();

        var body = new
        {
            nombre = "New Name",
            nit = "900111000",
            telefono = "3009998877",
            ciudad = "Cali",
        };
        var putResp = await client.PutAsJsonAsync($"/api/v1/clientes/{seeded.Id}", body);
        Assert.Equal(HttpStatusCode.OK, putResp.StatusCode);
        var afterPut = await putResp.Content.ReadFromJsonAsync<ClienteResponse>();

        var getResp = await client.GetAsync($"/api/v1/clientes/{seeded.Id}");
        Assert.Equal(HttpStatusCode.OK, getResp.StatusCode);
        var afterGet = await getResp.Content.ReadFromJsonAsync<ClienteResponse>();

        Assert.NotNull(afterPut);
        Assert.NotNull(afterGet);
        Assert.Equal(afterPut!.CreatedAt, afterGet!.CreatedAt);
        // UpdatedAt is strictly greater than CreatedAt on the returned DTO.
        Assert.True(afterGet.UpdatedAt > afterGet.CreatedAt);
    }

    // [P2] GIVEN a body with EXTRA unknown fields, THEN they are ignored and the update succeeds.
    [Fact]
    public async Task UpdateCliente_IgnoresExtraFields_InBody()
    {
        var seeded = ClienteEntity.Create("Old Name", "900111000", "3000000000", "Bogotá");
        var (factory, _) = FactoryWithFake(seeded);
        using var _f = factory;
        using var client = factory.CreateClient();

        var body = new
        {
            nombre = "New Name",
            nit = "900111000",
            telefono = "3009998877",
            ciudad = "Cali",
            // Extras — must be ignored, not rejected.
            id = Guid.NewGuid(),
            createdAt = "2020-01-01T00:00:00Z",
            unknownField = "should-be-dropped",
        };
        var response = await client.PutAsJsonAsync($"/api/v1/clientes/{seeded.Id}", body);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<ClienteResponse>();
        Assert.NotNull(dto);
        // The URL id wins — the body id is ignored.
        Assert.Equal(seeded.Id, dto!.Id);
        Assert.Equal("New Name", dto.Nombre);
    }

    // ─── 404 route-constraint edges (AC #11) ─────────────────────────────

    // [P1] GIVEN various non-Guid path segments, THEN the route constraint short-circuits with 404.
    [Theory]
    [InlineData("abc")]
    [InlineData("123")]
    [InlineData("not-a-guid-value")]
    [InlineData("00000000-0000-0000-0000-00000000000")]   // 35 hex chars — one short of a Guid.
    public async Task UpdateCliente_Returns404_ForNonGuidPath_MultipleShapes(string suffix)
    {
        var (factory, _) = FactoryWithFake();
        using var _f = factory;
        using var client = factory.CreateClient();

        var body = new
        {
            nombre = "Any",
            nit = "900111000",
            telefono = "3000000000",
            ciudad = "Cali",
        };
        var response = await client.PutAsJsonAsync($"/api/v1/clientes/{suffix}", body);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ─── Concurrency ─────────────────────────────────────────────────────

    // [P2] GIVEN three concurrent PUTs on DIFFERENT rows, THEN all succeed with 200.
    [Fact]
    public async Task UpdateCliente_HandlesConcurrentRequests_OnDifferentRows()
    {
        var rowA = ClienteEntity.Create("A", "111", "3001111111", "Cali");
        var rowB = ClienteEntity.Create("B", "222", "3002222222", "Bogotá");
        var rowC = ClienteEntity.Create("C", "333", "3003333333", "Medellín");
        var (factory, _) = FactoryWithFake(rowA, rowB, rowC);
        using var _f = factory;
        using var client = factory.CreateClient();

        var b1 = new { nombre = "A-new", nit = "111", telefono = "3001111111", ciudad = "Cali" };
        var b2 = new { nombre = "B-new", nit = "222", telefono = "3002222222", ciudad = "Bogotá" };
        var b3 = new { nombre = "C-new", nit = "333", telefono = "3003333333", ciudad = "Medellín" };

        var results = await Task.WhenAll(
            client.PutAsJsonAsync($"/api/v1/clientes/{rowA.Id}", b1),
            client.PutAsJsonAsync($"/api/v1/clientes/{rowB.Id}", b2),
            client.PutAsJsonAsync($"/api/v1/clientes/{rowC.Id}", b3));

        Assert.All(results, r => Assert.Equal(HttpStatusCode.OK, r.StatusCode));
    }

    // ─── 500 anti-leak ───────────────────────────────────────────────────

    // [P1] GIVEN an unexpected repository failure during PUT, THEN 500 surfaces with NO leaked internals (NFR6).
    [Fact]
    public async Task UpdateCliente_Returns500_WithoutLeakingInternals_WhenRepositoryThrows()
    {
        var seeded = ClienteEntity.Create("Old Name", "900111000", "3000000000", "Bogotá");
        var throwing = new ThrowingRepository(seeded);
        using var factory = FactoryWithRepo(throwing);
        using var client = factory.CreateClient();

        var body = new
        {
            nombre = "New Name",
            nit = "900111000",
            telefono = "3009998877",
            ciudad = "Cali",
        };
        var response = await client.PutAsJsonAsync($"/api/v1/clientes/{seeded.Id}", body);

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        var raw = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("Simulated DB failure", raw);
        Assert.DoesNotContain("stackTrace", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("InvalidOperationException", raw, StringComparison.OrdinalIgnoreCase);
    }

    // ─── helpers ─────────────────────────────────────────────────────────

    private sealed record ClienteResponse(
        Guid Id, string Nombre, string Nit, string Telefono, string Ciudad,
        DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt);

    private sealed class FakeClienteRepository : IClienteRepository
    {
        private readonly List<ClienteEntity> _items = new();
        private readonly object _lock = new();

        public int UpdateAsyncCalls { get; private set; }

        public void SeedEntity(ClienteEntity entity)
        {
            lock (_lock) _items.Add(entity);
        }

        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct)
        {
            lock (_lock) return Task.FromResult<IReadOnlyList<ClienteEntity>>(_items.ToList());
        }

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
        {
            lock (_lock) return Task.FromResult(_items.FirstOrDefault(e => e.Id == id));
        }

        public Task AddAsync(ClienteEntity cliente, CancellationToken ct)
        {
            lock (_lock)
            {
                _items.Add(cliente);
                return Task.CompletedTask;
            }
        }

        public Task<bool> NitExistsAsync(string nit, CancellationToken ct)
        {
            lock (_lock) return Task.FromResult(_items.Any(e => e.Nit == nit));
        }

        public Task UpdateAsync(ClienteEntity cliente, CancellationToken ct)
        {
            lock (_lock)
            {
                UpdateAsyncCalls += 1;
                var existing = _items.FindIndex(e => e.Id == cliente.Id);
                if (existing >= 0) _items[existing] = cliente;
                return Task.CompletedTask;
            }
        }

        public Task<bool> NitExistsForAnotherAsync(Guid id, string nit, CancellationToken ct)
        {
            lock (_lock)
            {
                var other = _items.FirstOrDefault(e => e.Nit == nit && e.Id != id);
                return Task.FromResult(other is not null);
            }
        }
    }

    private sealed class ThrowingRepository : IClienteRepository
    {
        private readonly ClienteEntity _seeded;

        public ThrowingRepository(ClienteEntity seeded)
        {
            _seeded = seeded;
        }

        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult<IReadOnlyList<ClienteEntity>>(new[] { _seeded });

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromResult<ClienteEntity?>(id == _seeded.Id ? _seeded : null);

        public Task AddAsync(ClienteEntity cliente, CancellationToken ct)
            => Task.CompletedTask;

        public Task<bool> NitExistsAsync(string nit, CancellationToken ct)
            => Task.FromResult(false);

        public Task UpdateAsync(ClienteEntity cliente, CancellationToken ct)
            => throw new InvalidOperationException("Simulated DB failure");

        public Task<bool> NitExistsForAnotherAsync(Guid id, string nit, CancellationToken ct)
            => Task.FromResult(false);
    }
}
