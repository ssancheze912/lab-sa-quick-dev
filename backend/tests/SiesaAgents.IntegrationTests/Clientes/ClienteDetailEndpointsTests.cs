/**
 * API Integration Tests — GET /api/v1/clientes/{id}
 * Story 2.2 — Client Detail View (ATDD RED phase)
 *
 * Test IDs covered:
 *   TC-E2-P2-09  GET /api/v1/clientes/{id} returns 404 + Problem Details for non-existent ID
 *
 * Stack: xUnit 2 + WebApplicationFactory<Program> + EF Core InMemory
 *
 * Expected RED failure:
 *   The route GET /api/v1/clientes/{id} does not exist yet → actual 404 or 405
 *   The test asserts on Problem Details body structure; that assertion fails until
 *   the endpoint is implemented with proper RFC 7807 Problem Details.
 *
 * Given-When-Then format per test method.
 */

using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Domain.Entities;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests.Clientes;

/// <summary>
/// Isolated WebApplicationFactory for Story 2.2 detail endpoint tests.
/// Each test class gets a unique in-memory database to prevent cross-test pollution.
/// </summary>
public sealed class ClienteDetailWebApplicationFactory : WebApplicationFactory<Program>
{
    public string DatabaseName { get; init; } = $"ClienteDetailTestDb_{Guid.NewGuid()}";

    protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remove all EF Core configuration services for AppDbContext to avoid
            // "dual provider" errors when swapping to InMemoryDatabase.
            var dbContextOptionsConfigType = typeof(Microsoft.EntityFrameworkCore.Infrastructure.IDbContextOptionsConfiguration<AppDbContext>);
            var toRemove = services
                .Where(d =>
                    d.ServiceType == typeof(DbContextOptions<AppDbContext>) ||
                    d.ServiceType == typeof(AppDbContext) ||
                    dbContextOptionsConfigType.IsAssignableFrom(d.ServiceType))
                .ToList();

            foreach (var d in toRemove)
                services.Remove(d);

            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase(DatabaseName));
        });
    }
}

/// <summary>
/// TC-E2-P2-09 — API integration test verifying that GET /api/v1/clientes/{id}
/// returns 404 + Problem Details RFC 7807 when the requested client does not exist.
/// </summary>
public sealed class ClienteDetailEndpointsTests : IClassFixture<ClienteDetailWebApplicationFactory>
{
    private readonly HttpClient _client;

    public ClienteDetailEndpointsTests(ClienteDetailWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    // -------------------------------------------------------------------------
    // TC-E2-P2-09: GET /api/v1/clientes/{id} returns 404 for non-existent ID
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-E2-P2-09 — Given a clienteId that does not exist in the database,
    /// When GET /api/v1/clientes/{id} is called,
    /// Then the response is HTTP 404 with a Problem Details body containing status: 404.
    /// </summary>
    [Fact]
    public async Task TC_E2_P2_09_GetClienteById_Returns404_WithProblemDetails_WhenClientNotFound()
    {
        // GIVEN: A UUID that has not been seeded in the database
        var nonExistentId = Guid.Empty; // 00000000-0000-0000-0000-000000000000

        // WHEN: GET /api/v1/clientes/{id} is called with a non-existent ID
        var response = await _client.GetAsync($"/api/v1/clientes/{nonExistentId}");

        // THEN: HTTP 404 Not Found
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        // THEN: Response body is Problem Details with status: 404
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        // Must have a "status" field equal to 404
        Assert.True(doc.RootElement.TryGetProperty("status", out var statusProp),
            $"Problem Details must contain 'status' field. Response body: {json}");
        Assert.Equal(404, statusProp.GetInt32());
    }

    /// <summary>
    /// Given a non-existent clienteId,
    /// When GET /api/v1/clientes/{id} is called,
    /// Then the Content-Type is application/problem+json (RFC 7807 compliance).
    /// </summary>
    [Fact]
    public async Task GetClienteById_Returns_ProblemJsonContentType_WhenClientNotFound()
    {
        // GIVEN: A UUID that does not exist
        var nonExistentId = new Guid("00000000-0000-0000-0000-000000000099");

        // WHEN: GET request to /api/v1/clientes/{id}
        var response = await _client.GetAsync($"/api/v1/clientes/{nonExistentId}");

        // THEN: 404 status
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        // THEN: Content-Type contains "problem+json" (RFC 7807)
        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
        Assert.Contains("problem+json", contentType,
            $"Expected Content-Type to contain 'problem+json' but got: {contentType}");
    }

    /// <summary>
    /// Given a valid UUID that exists in the database,
    /// When GET /api/v1/clientes/{id} is called,
    /// Then HTTP 200 is returned with a ClienteDto body including all required fields.
    /// </summary>
    [Fact]
    public async Task GetClienteById_Returns200_WithClienteDto_WhenClientExists()
    {
        // GIVEN: A client is seeded in the database
        // Note: This test will fail in RED phase because the endpoint doesn't exist yet.
        // In GREEN phase, once the endpoint is implemented, this test will pass.
        // We use the factory's service scope to seed directly.
        var uniqueFactory = new ClienteDetailWebApplicationFactory();
        var scopedClient = uniqueFactory.CreateClient();

        using var scope = uniqueFactory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var cliente = ClienteEntity.Create(
            nombre: "Empresa Test GET",
            nit: "900999888-1",
            telefono: "3009998881",
            ciudad: "Medellín",
            createdAt: DateTimeOffset.UtcNow,
            updatedAt: DateTimeOffset.UtcNow
        );
        await dbContext.Clientes.AddAsync(cliente);
        await dbContext.SaveChangesAsync();

        // WHEN: GET /api/v1/clientes/{id} with the seeded client's ID
        var response = await scopedClient.GetAsync($"/api/v1/clientes/{cliente.Id}");

        // THEN: HTTP 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // THEN: Response body contains the ClienteDto with all expected fields
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("id", out var idProp), "Missing 'id' field");
        Assert.Equal(cliente.Id.ToString(), idProp.GetString());

        Assert.True(root.TryGetProperty("nombre", out var nombreProp), "Missing 'nombre' field");
        Assert.Equal("Empresa Test GET", nombreProp.GetString());

        Assert.True(root.TryGetProperty("nit", out var nitProp), "Missing 'nit' field");
        Assert.Equal("900999888-1", nitProp.GetString());

        Assert.True(root.TryGetProperty("telefono", out var telefonoProp), "Missing 'telefono' field");
        Assert.Equal("3009998881", telefonoProp.GetString());

        Assert.True(root.TryGetProperty("ciudad", out var ciudadProp), "Missing 'ciudad' field");
        Assert.Equal("Medellín", ciudadProp.GetString());

        Assert.True(root.TryGetProperty("createdAt", out var createdAtProp), "Missing 'createdAt' field");
        Assert.True(
            DateTimeOffset.TryParse(createdAtProp.GetString(), out _),
            $"'createdAt' must be a valid DateTimeOffset ISO 8601 string: {createdAtProp.GetString()}"
        );
    }

    /// <summary>
    /// Given a non-existent clienteId,
    /// When GET /api/v1/clientes/{id} is called,
    /// Then the Problem Details body does NOT contain 'stackTrace', 'exception', or 'innerException'
    /// (NFR6: no internal details exposed in error responses).
    /// </summary>
    [Fact]
    public async Task GetClienteById_DoesNotExposeStackTrace_WhenClientNotFound()
    {
        // GIVEN: A UUID that does not exist
        var nonExistentId = new Guid("00000000-0000-0000-0000-000000000088");

        // WHEN: GET /api/v1/clientes/{id}
        var response = await _client.GetAsync($"/api/v1/clientes/{nonExistentId}");

        // THEN: 404 status
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        // THEN: Response body contains NO internal debugging information
        var json = await response.Content.ReadAsStringAsync().ConfigureAwait(false);
        var lowerJson = json.ToLowerInvariant();

        Assert.DoesNotContain("stacktrace", lowerJson,
            $"Stack trace must not be exposed. Response: {json}");
        Assert.DoesNotContain("exception", lowerJson,
            $"Exception details must not be exposed. Response: {json}");
        Assert.DoesNotContain("innerexception", lowerJson,
            $"InnerException details must not be exposed. Response: {json}");
    }
}
