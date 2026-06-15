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
/// Story 2.5 — integration tests for <c>DELETE /api/v1/clientes/{id:guid}</c>.
///
/// Covers AC #10 (seven named tests):
///   * DeleteCliente_WithExistingId_Returns204NoContent
///   * DeleteCliente_WhenNotFound_Returns404ProblemDetails
///   * DeleteCliente_WithInvalidGuid_Returns400ProblemDetails
///   * DeleteCliente_ResponseHasNoBody
///   * DeleteCliente_AfterDelete_GetByIdReturns404
///   * DeleteCliente_IsIdempotentLikeRest_SecondDeleteReturns404
///   * DeleteCliente_OmitsContactosOrphanedHeader_WhenNoContactos
///
/// Reuses the InMemory-provider stripping pattern from Stories 2.1/2.2/2.3/2.4.
/// </summary>
public class ClientesDeleteEndpointTests : IClassFixture<SiesaAgentsApiFactory>
{
    private readonly SiesaAgentsApiFactory _factory;

    public ClientesDeleteEndpointTests(SiesaAgentsApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task DeleteCliente_WithExistingId_Returns204NoContent()
    {
        using var client = CreateClientWithCleanInMemoryDb(out var factory);
        var seededId = SeedCliente(factory, "Cliente A", "900111222-1", null, null);

        using var response = await client.DeleteAsync($"/api/v1/clientes/{seededId}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        // Verify the cliente row is gone via a fresh scope on the DbContext.
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.False(await db.Clientes.AnyAsync(c => c.Id == seededId));
    }

    [Fact]
    public async Task DeleteCliente_WhenNotFound_Returns404ProblemDetails()
    {
        using var client = CreateClientWithCleanInMemoryDb(out _);

        var randomId = Guid.NewGuid();
        using var response = await client.DeleteAsync($"/api/v1/clientes/{randomId}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var raw = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(raw);

        Assert.Equal(404, doc.RootElement.GetProperty("status").GetInt32());
        Assert.Equal(
            "Cliente no encontrado.",
            doc.RootElement.GetProperty("title").GetString());
        Assert.Equal(
            $"/api/v1/clientes/{randomId}",
            doc.RootElement.GetProperty("instance").GetString());

        AssertNoInternalLeakage(doc.RootElement);
    }

    [Fact]
    public async Task DeleteCliente_WithInvalidGuid_Returns400ProblemDetails()
    {
        using var client = CreateClientWithCleanInMemoryDb(out _);

        using var response = await client.DeleteAsync("/api/v1/clientes/not-a-guid");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var raw = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(raw);

        Assert.Equal(
            "Identificador de cliente inválido.",
            doc.RootElement.GetProperty("title").GetString());
        Assert.Equal(
            "El identificador debe ser un UUID válido.",
            doc.RootElement.GetProperty("detail").GetString());

        AssertNoInternalLeakage(doc.RootElement);
    }

    [Fact]
    public async Task DeleteCliente_ResponseHasNoBody()
    {
        using var client = CreateClientWithCleanInMemoryDb(out var factory);
        var seededId = SeedCliente(factory, "Cliente Vacío", "900111222-2", null, null);

        using var response = await client.DeleteAsync($"/api/v1/clientes/{seededId}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        // Per the 204 contract: no body. Some HTTP clients may not surface
        // ContentLength explicitly (null), so accept either 0 or null AND
        // verify the body string is empty as a defense-in-depth assertion.
        var contentLength = response.Content.Headers.ContentLength;
        Assert.True(contentLength == 0 || contentLength is null);

        var body = await response.Content.ReadAsStringAsync();
        Assert.Equal(string.Empty, body);
    }

    [Fact]
    public async Task DeleteCliente_AfterDelete_GetByIdReturns404()
    {
        using var client = CreateClientWithCleanInMemoryDb(out var factory);
        var seededId = SeedCliente(factory, "Cliente Eliminado", "900222333-3", null, null);

        using var deleteResponse = await client.DeleteAsync($"/api/v1/clientes/{seededId}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        using var getResponse = await client.GetAsync($"/api/v1/clientes/{seededId}");
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
        Assert.Equal(
            "application/problem+json",
            getResponse.Content.Headers.ContentType?.MediaType);

        var raw = await getResponse.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(raw);
        Assert.Equal(
            "Cliente no encontrado.",
            doc.RootElement.GetProperty("title").GetString());
    }

    [Fact]
    public async Task DeleteCliente_IsIdempotentLikeRest_SecondDeleteReturns404()
    {
        using var client = CreateClientWithCleanInMemoryDb(out var factory);
        var seededId = SeedCliente(factory, "Cliente Doble", "900333444-4", null, null);

        // First DELETE → 204.
        using (var first = await client.DeleteAsync($"/api/v1/clientes/{seededId}"))
        {
            Assert.Equal(HttpStatusCode.NoContent, first.StatusCode);
        }

        // Second DELETE → 404 with the same Problem Details body shape.
        using var second = await client.DeleteAsync($"/api/v1/clientes/{seededId}");
        Assert.Equal(HttpStatusCode.NotFound, second.StatusCode);
        Assert.Equal(
            "application/problem+json",
            second.Content.Headers.ContentType?.MediaType);

        var raw = await second.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(raw);
        Assert.Equal(
            "Cliente no encontrado.",
            doc.RootElement.GetProperty("title").GetString());
    }

    [Fact]
    public async Task DeleteCliente_OmitsContactosOrphanedHeader_WhenNoContactos()
    {
        // Locks the Story 2.5 forward-compat contract: when the cliente has
        // NO associated contactos (the contactos table does not exist yet),
        // the response MUST NOT include the `X-Contactos-Orphaned` header.
        // The frontend then defaults to the standard success toast.
        using var client = CreateClientWithCleanInMemoryDb(out var factory);
        var seededId = SeedCliente(factory, "Cliente Sin Contactos", "900444555-5", null, null);

        using var response = await client.DeleteAsync($"/api/v1/clientes/{seededId}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.False(response.Headers.Contains("X-Contactos-Orphaned"));
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
    /// Seed a single cliente via reflection on the domain factory (matches the
    /// pattern from <see cref="ClientesUpdateEndpointTests"/>). Returns the new id.
    /// </summary>
    private static Guid SeedCliente(
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
        return (Guid)idProperty!.GetValue(entity)!;
    }
}
