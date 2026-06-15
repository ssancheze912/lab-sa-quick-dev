using System;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Reflection;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;
using SiesaAgents.IntegrationTests.Fixtures;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// Story 2.4 — integration tests for <c>PUT /api/v1/clientes/{id:guid}</c>.
///
/// Covers AC #13 (eight named tests):
///   * UpdateCliente_WithValidPayload_Returns200WithUpdatedClienteDto
///   * UpdateCliente_WithUnchangedNit_Returns200 (critical AC #8 regression)
///   * UpdateCliente_WithDuplicateNitFromAnotherCliente_Returns409ProblemDetails
///   * UpdateCliente_WhenNotFound_Returns404ProblemDetails
///   * UpdateCliente_WithMissingNombre_Returns400ProblemDetails
///   * UpdateCliente_WithMissingNit_Returns400ProblemDetails
///   * UpdateCliente_WithOversizedNombre_Returns400ProblemDetails
///   * UpdateCliente_WithInvalidGuid_Returns400
///
/// Uses the InMemory-provider stripping pattern from Stories 2.1/2.2/2.3.
/// </summary>
public class ClientesUpdateEndpointTests : IClassFixture<SiesaAgentsApiFactory>
{
    private readonly SiesaAgentsApiFactory _factory;

    public ClientesUpdateEndpointTests(SiesaAgentsApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task UpdateCliente_WithValidPayload_Returns200WithUpdatedClienteDto()
    {
        using var client = CreateClientWithCleanInMemoryDb(out var factory);
        var (seededId, seededCreatedAt, seededUpdatedAt) =
            SeedCliente(factory, "Cliente Original", "900111222-1", "3001110000", "Bogotá");

        // Sleep 5ms so UpdatedAt is strictly greater than the seeded value.
        await Task.Delay(5);

        var payload = new
        {
            nombre = "Cliente Editado",
            nit = "900111222-1",
            telefono = "3001110000",
            ciudad = "Medellín",
        };

        using var response = await client.PutAsJsonAsync($"/api/v1/clientes/{seededId}", payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);

        var raw = await response.Content.ReadAsStringAsync();

        // camelCase keys per the API contract.
        Assert.Contains("\"id\"", raw);
        Assert.Contains("\"createdAt\"", raw);
        Assert.Contains("\"updatedAt\"", raw);
        Assert.DoesNotContain("\"created_at\"", raw);
        Assert.DoesNotContain("\"Nombre\"", raw);

        using var doc = JsonDocument.Parse(raw);
        Assert.Equal(seededId.ToString(), doc.RootElement.GetProperty("id").GetString());
        Assert.Equal("Cliente Editado", doc.RootElement.GetProperty("nombre").GetString());
        Assert.Equal("Medellín", doc.RootElement.GetProperty("ciudad").GetString());
        Assert.Equal("900111222-1", doc.RootElement.GetProperty("nit").GetString());
        Assert.Equal("3001110000", doc.RootElement.GetProperty("telefono").GetString());

        // createdAt preserved; updatedAt strictly greater than the seeded value.
        var createdAt = DateTimeOffset.Parse(doc.RootElement.GetProperty("createdAt").GetString()!);
        var updatedAt = DateTimeOffset.Parse(doc.RootElement.GetProperty("updatedAt").GetString()!);
        Assert.Equal(seededCreatedAt, createdAt);
        Assert.True(updatedAt > seededUpdatedAt);
    }

    [Fact]
    public async Task UpdateCliente_WithUnchangedNit_Returns200()
    {
        // AC #8 — critical regression: editing without changing the NIT must
        // NOT return 409, because the uniqueness check excludes the current id.
        using var client = CreateClientWithCleanInMemoryDb(out var factory);
        var (seededId, _, _) =
            SeedCliente(factory, "Cliente A", "900111222-1", "3001110000", "Bogotá");

        var payload = new
        {
            nombre = "Cliente A Renombrado",
            nit = "900111222-1", // same NIT as before
            telefono = "3001110000",
            ciudad = "Bogotá",
        };

        using var response = await client.PutAsJsonAsync($"/api/v1/clientes/{seededId}", payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var raw = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(raw);
        Assert.Equal("Cliente A Renombrado", doc.RootElement.GetProperty("nombre").GetString());
        Assert.Equal("900111222-1", doc.RootElement.GetProperty("nit").GetString());
    }

    [Fact]
    public async Task UpdateCliente_WithDuplicateNitFromAnotherCliente_Returns409ProblemDetails()
    {
        using var client = CreateClientWithCleanInMemoryDb(out var factory);
        SeedCliente(factory, "Cliente A", "900111222-1", null, null);
        var (idB, _, _) = SeedCliente(factory, "Cliente B", "900222333-2", null, null);

        // PUT B with A's NIT.
        var payload = new
        {
            nombre = "Cliente B",
            nit = "900111222-1",
            telefono = (string?)null,
            ciudad = (string?)null,
        };

        using var response = await client.PutAsJsonAsync($"/api/v1/clientes/{idB}", payload);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var raw = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(raw);

        Assert.Equal(409, doc.RootElement.GetProperty("status").GetInt32());
        Assert.Equal(
            "El NIT/RUC ya está registrado.",
            doc.RootElement.GetProperty("title").GetString());

        AssertNoInternalLeakage(doc.RootElement);
    }

    [Fact]
    public async Task UpdateCliente_WhenNotFound_Returns404ProblemDetails()
    {
        using var client = CreateClientWithCleanInMemoryDb(out _);

        var randomId = Guid.NewGuid();
        var payload = new
        {
            nombre = "Cualquiera",
            nit = "900000000-0",
            telefono = (string?)null,
            ciudad = (string?)null,
        };

        using var response = await client.PutAsJsonAsync($"/api/v1/clientes/{randomId}", payload);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var raw = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(raw);

        Assert.Equal(404, doc.RootElement.GetProperty("status").GetInt32());
        Assert.Equal(
            "Cliente no encontrado.",
            doc.RootElement.GetProperty("title").GetString());

        AssertNoInternalLeakage(doc.RootElement);
    }

    [Fact]
    public async Task UpdateCliente_WithMissingNombre_Returns400ProblemDetails()
    {
        using var client = CreateClientWithCleanInMemoryDb(out var factory);
        var (id, _, _) = SeedCliente(factory, "Cliente Original", "900111222-1", null, null);

        var payload = new
        {
            nit = "900111222-1",
            telefono = (string?)null,
            ciudad = (string?)null,
        };

        using var response = await client.PutAsJsonAsync($"/api/v1/clientes/{id}", payload);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var raw = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(raw);

        Assert.True(doc.RootElement.TryGetProperty("errors", out var errors));
        var nombreErrors = LocateFieldErrors(errors, "Nombre");
        Assert.NotEmpty(nombreErrors);

        AssertNoInternalLeakage(doc.RootElement);
    }

    [Fact]
    public async Task UpdateCliente_WithMissingNit_Returns400ProblemDetails()
    {
        using var client = CreateClientWithCleanInMemoryDb(out var factory);
        var (id, _, _) = SeedCliente(factory, "Cliente Original", "900111222-1", null, null);

        var payload = new
        {
            nombre = "Cliente Sin Nit",
            telefono = (string?)null,
            ciudad = (string?)null,
        };

        using var response = await client.PutAsJsonAsync($"/api/v1/clientes/{id}", payload);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var raw = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(raw);

        Assert.True(doc.RootElement.TryGetProperty("errors", out var errors));
        var nitErrors = LocateFieldErrors(errors, "Nit");
        Assert.NotEmpty(nitErrors);

        AssertNoInternalLeakage(doc.RootElement);
    }

    [Fact]
    public async Task UpdateCliente_WithOversizedNombre_Returns400ProblemDetails()
    {
        using var client = CreateClientWithCleanInMemoryDb(out var factory);
        var (id, _, _) = SeedCliente(factory, "Cliente Original", "900111222-1", null, null);

        var payload = new
        {
            nombre = new string('x', 201),
            nit = "900111222-1",
            telefono = (string?)null,
            ciudad = (string?)null,
        };

        using var response = await client.PutAsJsonAsync($"/api/v1/clientes/{id}", payload);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var raw = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(raw);

        Assert.True(doc.RootElement.TryGetProperty("errors", out var errors));
        var nombreErrors = LocateFieldErrors(errors, "Nombre");
        Assert.NotEmpty(nombreErrors);
        Assert.Contains("200", nombreErrors.First());

        AssertNoInternalLeakage(doc.RootElement);
    }

    [Fact]
    public async Task UpdateCliente_WithInvalidGuid_Returns400()
    {
        using var client = CreateClientWithCleanInMemoryDb(out _);

        var payload = new
        {
            nombre = "Cualquiera",
            nit = "900111222-1",
            telefono = (string?)null,
            ciudad = (string?)null,
        };

        using var response = await client.PutAsJsonAsync("/api/v1/clientes/not-a-guid", payload);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private static void AssertNoInternalLeakage(JsonElement root)
    {
        Assert.False(root.TryGetProperty("stackTrace", out _));
        Assert.False(root.TryGetProperty("exception", out _));
        Assert.False(root.TryGetProperty("stack", out _));

        if (root.TryGetProperty("detail", out var detail) && detail.ValueKind == JsonValueKind.String)
        {
            var s = detail.GetString() ?? string.Empty;
            Assert.DoesNotContain("System.", s);
            Assert.DoesNotContain("SiesaAgents.", s);
            Assert.DoesNotContain("Exception", s);
        }
    }

    private static System.Collections.Generic.IReadOnlyList<string> LocateFieldErrors(JsonElement errors, string pascalKey)
    {
        if (errors.TryGetProperty(pascalKey, out var pascal) && pascal.ValueKind == JsonValueKind.Array)
            return pascal.EnumerateArray().Select(e => e.GetString() ?? string.Empty).ToList();

        var camelKey = char.ToLowerInvariant(pascalKey[0]) + pascalKey.Substring(1);
        if (errors.TryGetProperty(camelKey, out var camel) && camel.ValueKind == JsonValueKind.Array)
            return camel.EnumerateArray().Select(e => e.GetString() ?? string.Empty).ToList();

        return Array.Empty<string>();
    }

    private HttpClient CreateClientWithCleanInMemoryDb(out InMemoryFactory factory)
    {
        factory = new InMemoryFactory(Guid.NewGuid().ToString());
        var client = factory.CreateClient();

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.EnsureCreated();

        return client;
    }

    /// <summary>
    /// Seed a single cliente through reflection (matches the pattern from
    /// <see cref="ClientesDetailEndpointTests"/>). Returns the new id along with
    /// the seeded <c>CreatedAt</c> / <c>UpdatedAt</c> values so callers can
    /// assert on timestamp preservation / bumps.
    /// </summary>
    private static (Guid Id, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt) SeedCliente(
        InMemoryFactory factory, string nombre, string nit, string? telefono, string? ciudad)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var asm = typeof(AppDbContext).Assembly;
        var domainAsm = asm.GetReferencedAssemblies()
            .Select(Assembly.Load)
            .FirstOrDefault(a => a.GetName().Name == "SiesaAgents.Domain");

        Assert.NotNull(domainAsm);

        var clrType = domainAsm!.GetType("SiesaAgents.Domain.Clientes.Entities.ClienteEntity");
        Assert.NotNull(clrType);

        var createMethod = clrType!.GetMethod("Create",
            new[] { typeof(string), typeof(string), typeof(string), typeof(string) });
        Assert.NotNull(createMethod);

        var entity = createMethod!.Invoke(null, new object?[] { nombre, nit, telefono, ciudad });
        Assert.NotNull(entity);

        db.Add(entity!);
        db.SaveChanges();

        var idProperty = clrType.GetProperty("Id");
        var createdAtProperty = clrType.GetProperty("CreatedAt");
        var updatedAtProperty = clrType.GetProperty("UpdatedAt");

        return (
            (Guid)idProperty!.GetValue(entity)!,
            (DateTimeOffset)createdAtProperty!.GetValue(entity)!,
            (DateTimeOffset)updatedAtProperty!.GetValue(entity)!);
    }
}
