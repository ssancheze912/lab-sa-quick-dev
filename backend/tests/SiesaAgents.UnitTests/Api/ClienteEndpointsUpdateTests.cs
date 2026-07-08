using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Api;

/// <summary>
/// Story 2.4 — ATDD (RED phase).
///
/// Endpoint tests for <c>PUT /api/v1/clientes/{id:guid}</c> (Task 4). Covers:
///   * AC #9  — 200 OK + full ClienteDto body; createdAt preserved,
///              updatedAt refreshed.
///   * AC #10 — 400 Bad Request with RFC 7807 ValidationProblem body,
///              camelCase field keys, Spanish messages, no leaks (NFR6).
///   * AC #11 — 404 Not Found with RFC 7807 body (via UseStatusCodePages
///              rewrite); route-constraint 404 for non-Guid paths.
///   * AC #12 — 409 Conflict with RFC 7807 Problem Details, Spanish detail,
///              exclude-self semantics (unchanged NIT is 200), no leaks
///              (NFR6, R-001), UpdateAsync never invoked on 409.
///   * Persistence integration — the updated row is visible on subsequent GETs
///     with the new Nombre and refreshed UpdatedAt.
///
/// Shares the <see cref="WebApplicationFactory{TEntryPoint}"/> +
/// <c>UseEnvironment("Testing")</c> + fake-repository override pattern
/// established by Stories 2.1/2.2/2.3.
///
/// RED until the following are wired:
///   - PUT endpoint on the /api/v1/clientes route group (Task 4)
///   - ValidationEndpointFilter&lt;UpdateClienteRequest&gt; hookup
///   - UpdateClienteCommandHandler registered in DI
///   - IClienteRepository.UpdateAsync / NitExistsForAnotherAsync implemented
///   - ClienteEntity.Update(...) method
/// </summary>
public sealed class ClienteEndpointsUpdateTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ClienteEndpointsUpdateTests(WebApplicationFactory<Program> factory)
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

    // ─── 200 happy path (AC #9) ──────────────────────────────────────────

    [Fact]
    public async Task UpdateCliente_Returns200_WithFullDto_WhenBodyIsValid()
    {
        var seeded = ClienteEntity.Create("Old Name", "900111000", "3000000000", "Bogotá");
        var seededCreatedAt = seeded.CreatedAt;
        var (factory, _) = FactoryWithFake(seeded);
        using var _f = factory;
        using var client = factory.CreateClient();

        // Small delay so UpdatedAt is strictly greater than CreatedAt.
        await Task.Delay(2);

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

        var dto = await response.Content.ReadFromJsonAsync<ClienteResponse>();
        Assert.NotNull(dto);
        Assert.Equal(seeded.Id, dto!.Id);
        Assert.Equal("New Name", dto.Nombre);
        Assert.Equal("900111000", dto.Nit);
        Assert.Equal("3009998877", dto.Telefono);
        Assert.Equal("Cali", dto.Ciudad);
        // AC #9 — createdAt is preserved verbatim from the seed.
        Assert.Equal(seededCreatedAt, dto.CreatedAt);
        // AC #9 — updatedAt is strictly greater than createdAt.
        Assert.True(dto.UpdatedAt > dto.CreatedAt);
    }

    // ─── 400 validation (AC #10) ─────────────────────────────────────────

    [Fact]
    public async Task UpdateCliente_Returns400_WithValidationProblem_WhenBodyIsIncomplete()
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

        // NFR6 anti-leak.
        Assert.DoesNotContain("stackTrace", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("exception", raw, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task UpdateCliente_Returns400_WithSpecificField_WhenOnlyOneFieldMissing()
    {
        var seeded = ClienteEntity.Create("Old Name", "900111000", "3000000000", "Bogotá");
        var (factory, _) = FactoryWithFake(seeded);
        using var _f = factory;
        using var client = factory.CreateClient();

        var body = new { nombre = "Ok", nit = "", telefono = "Ok", ciudad = "Ok" };

        var response = await client.PutAsJsonAsync($"/api/v1/clientes/{seeded.Id}", body);

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

    // ─── 404 not-found (AC #11) ──────────────────────────────────────────

    [Fact]
    public async Task UpdateCliente_Returns404_WithProblemDetails_WhenIdDoesNotExist()
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
        var missingId = Guid.NewGuid();

        var response = await client.PutAsJsonAsync($"/api/v1/clientes/{missingId}", body);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
        Assert.StartsWith("application/problem+json", contentType);

        var raw = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(raw);
        Assert.True(doc.RootElement.TryGetProperty("title", out _));
        Assert.Equal(404, doc.RootElement.GetProperty("status").GetInt32());

        // NFR6 / R-001 — no framework internals leak.
        Assert.DoesNotContain("stackTrace", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("exception", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("NullReferenceException", raw, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task UpdateCliente_Returns404_ForNonGuidPath()
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

        var response = await client.PutAsJsonAsync("/api/v1/clientes/not-a-guid", body);

        // Route constraint short-circuits with 404 — same behaviour as
        // Story 2.2 for GET /{id:guid}.
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ─── 409 NIT-conflict (AC #12) ───────────────────────────────────────

    [Fact]
    public async Task UpdateCliente_Returns409_WithProblemDetails_WhenNitCollidesWithAnotherRow()
    {
        var rowA = ClienteEntity.Create("Alpha", "900000900", "3000000000", "Bogotá");
        var rowB = ClienteEntity.Create("Beta", "800000800", "3000000000", "Bogotá");
        var (factory, repo) = FactoryWithFake(rowA, rowB);
        using var _f = factory;
        using var client = factory.CreateClient();

        var body = new
        {
            nombre = "Alpha",
            // Trying to steal B's NIT.
            nit = "800000800",
            telefono = "3000000000",
            ciudad = "Bogotá",
        };

        var response = await client.PutAsJsonAsync($"/api/v1/clientes/{rowA.Id}", body);

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

        // AC #12 — application-level check blocks the write.
        Assert.Equal(0, repo.UpdateAsyncCalls);
    }

    // AC #6 — Same-NIT round trip must succeed.
    [Fact]
    public async Task UpdateCliente_Returns200_WhenNitIsUnchanged()
    {
        var seeded = ClienteEntity.Create("Old Name", "900111000", "3000000000", "Bogotá");
        var (factory, _) = FactoryWithFake(seeded);
        using var _f = factory;
        using var client = factory.CreateClient();

        var body = new
        {
            nombre = "New Name",
            // Same NIT as the seeded row.
            nit = "900111000",
            telefono = "3009998877",
            ciudad = "Cali",
        };

        var response = await client.PutAsJsonAsync($"/api/v1/clientes/{seeded.Id}", body);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<ClienteResponse>();
        Assert.NotNull(dto);
        Assert.Equal("900111000", dto!.Nit);
        Assert.Equal("New Name", dto.Nombre);
    }

    // ─── Persistence integration ─────────────────────────────────────────

    [Fact]
    public async Task UpdateCliente_PersistsRow_ThatIsThenVisibleOnGet()
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

        var putResponse = await client.PutAsJsonAsync($"/api/v1/clientes/{seeded.Id}", body);
        Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);
        var updated = await putResponse.Content.ReadFromJsonAsync<ClienteResponse>();
        Assert.NotNull(updated);

        var getResponse = await client.GetAsync($"/api/v1/clientes/{seeded.Id}");
        getResponse.EnsureSuccessStatusCode();
        var fetched = await getResponse.Content.ReadFromJsonAsync<ClienteResponse>();

        Assert.NotNull(fetched);
        Assert.Equal("New Name", fetched!.Nombre);
        Assert.Equal(updated!.UpdatedAt, fetched.UpdatedAt);
    }

    // ─── helpers ─────────────────────────────────────────────────────────

    private sealed record ClienteResponse(
        Guid Id, string Nombre, string Nit, string Telefono, string Ciudad,
        DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt);

    private sealed class FakeClienteRepository : IClienteRepository
    {
        private readonly List<ClienteEntity> _items = new();

        public int UpdateAsyncCalls { get; private set; }
        public int NitExistsForAnotherAsyncCalls { get; private set; }
        public int AddAsyncCalls { get; private set; }

        public void SeedEntity(ClienteEntity entity) => _items.Add(entity);

        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult<IReadOnlyList<ClienteEntity>>(_items);

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromResult(_items.FirstOrDefault(e => e.Id == id));

        public Task AddAsync(ClienteEntity cliente, CancellationToken ct)
        {
            AddAsyncCalls += 1;
            _items.Add(cliente);
            return Task.CompletedTask;
        }

        public Task<bool> NitExistsAsync(string nit, CancellationToken ct)
            => Task.FromResult(_items.Any(e => e.Nit == nit));

        public Task UpdateAsync(ClienteEntity cliente, CancellationToken ct)
        {
            UpdateAsyncCalls += 1;
            var existing = _items.FindIndex(e => e.Id == cliente.Id);
            if (existing >= 0) _items[existing] = cliente;
            return Task.CompletedTask;
        }

        public Task<bool> NitExistsForAnotherAsync(Guid id, string nit, CancellationToken ct)
        {
            NitExistsForAnotherAsyncCalls += 1;
            var other = _items.FirstOrDefault(e => e.Nit == nit && e.Id != id);
            return Task.FromResult(other is not null);
        }
    }
}
