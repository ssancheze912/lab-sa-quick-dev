using System;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;
using SiesaAgents.IntegrationTests.Fixtures;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// Story 2.3 — integration tests for <c>POST /api/v1/clientes</c>.
///
/// Covers Acceptance Criterion #11 (six named tests):
///   * CreateCliente_WithValidPayload_Returns201WithClienteDto
///   * CreateCliente_WithDuplicateNit_Returns409ProblemDetails
///   * CreateCliente_WithMissingNombre_Returns400ProblemDetails
///   * CreateCliente_WithMissingNit_Returns400ProblemDetails
///   * CreateCliente_WithOversizedNombre_Returns400ProblemDetails
///   * CreateCliente_WithEmptyStringFields_Returns400ProblemDetails
///
/// Uses the same InMemory-provider stripping pattern as Story 2.1 / 2.2 so the
/// tests stay deterministic and don't require a live PostgreSQL instance.
/// </summary>
public class ClientesCreateEndpointTests : IClassFixture<SiesaAgentsApiFactory>
{
    private readonly SiesaAgentsApiFactory _factory;

    public ClientesCreateEndpointTests(SiesaAgentsApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task CreateCliente_WithValidPayload_Returns201WithClienteDto()
    {
        // GIVEN
        using var client = CreateClientWithCleanInMemoryDb(out _);

        var payload = new
        {
            nombre = "Acme S.A.S.",
            nit = "900.123.456-7",
            telefono = "+57 300 000 0000",
            ciudad = "Medellín",
        };

        // WHEN
        using var response = await client.PostAsJsonAsync("/api/v1/clientes", payload);

        // THEN
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);

        // Location header points at the new resource.
        Assert.NotNull(response.Headers.Location);
        Assert.StartsWith("/api/v1/clientes/", response.Headers.Location!.ToString());

        var raw = await response.Content.ReadAsStringAsync();

        // camelCase keys per the API contract.
        Assert.Contains("\"id\"", raw);
        Assert.Contains("\"nombre\"", raw);
        Assert.Contains("\"nit\"", raw);
        Assert.Contains("\"telefono\"", raw);
        Assert.Contains("\"ciudad\"", raw);
        Assert.Contains("\"createdAt\"", raw);
        Assert.Contains("\"updatedAt\"", raw);

        // Negative — NEVER snake_case or PascalCase keys.
        Assert.DoesNotContain("\"created_at\"", raw);
        Assert.DoesNotContain("\"Nombre\"", raw);

        using var doc = JsonDocument.Parse(raw);
        Assert.Equal(JsonValueKind.Object, doc.RootElement.ValueKind);

        Assert.Equal("Acme S.A.S.", doc.RootElement.GetProperty("nombre").GetString());
        Assert.Equal("900.123.456-7", doc.RootElement.GetProperty("nit").GetString());
        Assert.Equal("+57 300 000 0000", doc.RootElement.GetProperty("telefono").GetString());
        Assert.Equal("Medellín", doc.RootElement.GetProperty("ciudad").GetString());

        var idStr = doc.RootElement.GetProperty("id").GetString();
        Assert.True(Guid.TryParse(idStr, out var newId));
        Assert.NotEqual(Guid.Empty, newId);

        // createdAt === updatedAt at creation time.
        Assert.Equal(
            doc.RootElement.GetProperty("createdAt").GetString(),
            doc.RootElement.GetProperty("updatedAt").GetString());

        // Location header points at /api/v1/clientes/{id}.
        Assert.Equal($"/api/v1/clientes/{newId}", response.Headers.Location!.ToString());
    }

    [Fact]
    public async Task CreateCliente_WithDuplicateNit_Returns409ProblemDetails()
    {
        // GIVEN: pre-seed a cliente with the target NIT.
        using var client = CreateClientWithCleanInMemoryDb(out var factory);

        const string duplicatedNit = "900.123.456-7";

        var seedPayload = new
        {
            nombre = "Cliente Existente",
            nit = duplicatedNit,
            telefono = "3001112233",
            ciudad = "Bogotá",
        };

        using var seedResponse = await client.PostAsJsonAsync("/api/v1/clientes", seedPayload);
        Assert.Equal(HttpStatusCode.Created, seedResponse.StatusCode);

        // WHEN: POST a second cliente with the SAME NIT.
        var duplicatePayload = new
        {
            nombre = "Cliente Duplicado",
            nit = duplicatedNit,
            telefono = "3009998877",
            ciudad = "Medellín",
        };

        using var response = await client.PostAsJsonAsync("/api/v1/clientes", duplicatePayload);

        // THEN
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var raw = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(raw);

        Assert.Equal(409, doc.RootElement.GetProperty("status").GetInt32());
        Assert.Equal(
            "El NIT/RUC ya está registrado.",
            doc.RootElement.GetProperty("title").GetString());

        // NFR6 — no internal leakage in the body.
        AssertNoInternalLeakage(doc.RootElement);
    }

    [Fact]
    public async Task CreateCliente_WithMissingNombre_Returns400ProblemDetails()
    {
        using var client = CreateClientWithCleanInMemoryDb(out _);

        var payload = new
        {
            nit = "900111222-1",
            telefono = "3001112233",
            ciudad = "Bogotá",
        };

        using var response = await client.PostAsJsonAsync("/api/v1/clientes", payload);

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
    public async Task CreateCliente_WithMissingNit_Returns400ProblemDetails()
    {
        using var client = CreateClientWithCleanInMemoryDb(out _);

        var payload = new
        {
            nombre = "Cliente Sin NIT",
            telefono = "3001112233",
            ciudad = "Bogotá",
        };

        using var response = await client.PostAsJsonAsync("/api/v1/clientes", payload);

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
    public async Task CreateCliente_WithOversizedNombre_Returns400ProblemDetails()
    {
        using var client = CreateClientWithCleanInMemoryDb(out _);

        var payload = new
        {
            nombre = new string('x', 201),
            nit = "900111222-1",
            telefono = "3001112233",
            ciudad = "Bogotá",
        };

        using var response = await client.PostAsJsonAsync("/api/v1/clientes", payload);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var raw = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(raw);

        Assert.True(doc.RootElement.TryGetProperty("errors", out var errors));
        var nombreErrors = LocateFieldErrors(errors, "Nombre");
        Assert.NotEmpty(nombreErrors);

        // The validator's max-length message mentions length / "200".
        var firstMessage = nombreErrors.First();
        Assert.Contains("200", firstMessage);

        AssertNoInternalLeakage(doc.RootElement);
    }

    [Fact]
    public async Task CreateCliente_WithEmptyStringFields_Returns400ProblemDetails()
    {
        using var client = CreateClientWithCleanInMemoryDb(out _);

        // Mix: empty `nombre` + whitespace-only `nit`. Both must fail NotEmpty.
        var payload = new
        {
            nombre = "",
            nit = "   ",
            telefono = "",
            ciudad = "",
        };

        using var response = await client.PostAsJsonAsync("/api/v1/clientes", payload);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var raw = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(raw);

        Assert.True(doc.RootElement.TryGetProperty("errors", out var errors));
        var nombreErrors = LocateFieldErrors(errors, "Nombre");
        var nitErrors = LocateFieldErrors(errors, "Nit");
        Assert.NotEmpty(nombreErrors);
        Assert.NotEmpty(nitErrors);

        AssertNoInternalLeakage(doc.RootElement);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Asserts that the Problem Details body has NO members that leak internal
    /// info (stack trace, exception class, fully-qualified type names). NFR6.
    /// </summary>
    private static void AssertNoInternalLeakage(JsonElement root)
    {
        Assert.False(root.TryGetProperty("stackTrace", out _));
        Assert.False(root.TryGetProperty("exception", out _));
        Assert.False(root.TryGetProperty("stack", out _));

        if (root.TryGetProperty("detail", out var detail) && detail.ValueKind == JsonValueKind.String)
        {
            var s = detail.GetString() ?? string.Empty;
            // Reject fully-qualified .NET type names in the detail (e.g.
            // "System.InvalidOperationException", "SiesaAgents.Application.X").
            Assert.DoesNotContain("System.", s);
            Assert.DoesNotContain("SiesaAgents.", s);
            Assert.DoesNotContain("Exception", s);
        }
    }

    /// <summary>
    /// FluentValidation's PropertyName casing follows the C# property name
    /// (PascalCase) but `Results.ValidationProblem` may apply
    /// camelCase serialization on the keys — accept both shapes.
    /// </summary>
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
}
