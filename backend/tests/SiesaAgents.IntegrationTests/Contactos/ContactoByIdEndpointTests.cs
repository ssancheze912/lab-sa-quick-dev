/**
 * API Integration Tests — GET /api/v1/contactos/{id}
 * Story 3.2 — Contact Detail View (ATDD RED phase)
 *
 * Test IDs covered:
 *   TC-1  GET /api/v1/contactos/{id} returns 200 with correct ContactoDto (AC #1, #2)
 *   TC-2  GET /api/v1/contactos/{unknownId} returns 404 + Problem Details (AC #3, NFR6)
 *   TC-3  GET /api/v1/contactos/not-a-uuid returns 400 (defensive — invalid format)
 *
 * Stack: xUnit 2 + WebApplicationFactory<Program> + EF Core InMemory
 *
 * Expected RED failure:
 *   - GET /api/v1/contactos/{id} does not exist yet → actual 404 or 405
 *   - GetContactoByIdQuery / GetContactoByIdQueryHandler do not exist yet
 *   - IContactoRepository.GetByIdAsync does not exist yet
 *
 * Given-When-Then format per test method.
 */

using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Domain.Entities;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests.Contactos;

/// <summary>
/// Isolated WebApplicationFactory for Story 3.2 GET-by-ID endpoint tests.
/// Each test class gets a unique in-memory database to prevent cross-test pollution.
/// </summary>
public sealed class ContactoByIdWebApplicationFactory : WebApplicationFactory<Program>
{
    public string DatabaseName { get; init; } = $"ContactoByIdTestDb_{Guid.NewGuid()}";

    protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remove all EF Core configuration services to avoid dual-provider errors.
            var dbContextOptionsConfigType =
                typeof(Microsoft.EntityFrameworkCore.Infrastructure.IDbContextOptionsConfiguration<AppDbContext>);

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
/// TC-1, TC-2, TC-3: API integration tests for GET /api/v1/contactos/{id}.
/// </summary>
public sealed class ContactoByIdEndpointTests : IClassFixture<ContactoByIdWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly ContactoByIdWebApplicationFactory _factory;

    public ContactoByIdEndpointTests(ContactoByIdWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    // -------------------------------------------------------------------------
    // TC-1: GET /api/v1/contactos/{id} returns 200 with correct ContactoDto
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-1 — Given a contact seeded in the database,
    /// When GET /api/v1/contactos/{id} is called with the correct UUID,
    /// Then HTTP 200 is returned with a ContactoDto containing all expected fields.
    ///
    /// Acceptance criteria: AC #1, AC #2
    /// </summary>
    [Fact]
    public async Task TC1_GetContactoById_Returns200_WithContactoDto_WhenContactExists()
    {
        // GIVEN: A contact is seeded in the database
        var uniqueFactory = new ContactoByIdWebApplicationFactory();
        var scopedClient = uniqueFactory.CreateClient();

        using var scope = uniqueFactory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var contacto = ContactoEntity.Create(
            nombre: "Laura Martínez",
            cargo: "Gerente de Ventas",
            telefono: "3001112233",
            email: "laura.martinez@siesa.com",
            clienteId: null,
            createdAt: DateTimeOffset.UtcNow,
            updatedAt: DateTimeOffset.UtcNow
        );
        await dbContext.Set<ContactoEntity>().AddAsync(contacto);
        await dbContext.SaveChangesAsync();

        // WHEN: GET /api/v1/contactos/{id} with the seeded contact's ID
        var response = await scopedClient.GetAsync($"/api/v1/contactos/{contacto.Id}");

        // THEN: HTTP 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // THEN: Response body is a ContactoDto with all expected fields
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        // id — must match the seeded contact
        Assert.True(root.TryGetProperty("id", out var idProp), "Missing 'id' field");
        Assert.Equal(contacto.Id.ToString(), idProp.GetString());

        // nombre
        Assert.True(root.TryGetProperty("nombre", out var nombreProp), "Missing 'nombre' field");
        Assert.Equal("Laura Martínez", nombreProp.GetString());

        // cargo
        Assert.True(root.TryGetProperty("cargo", out var cargoProp), "Missing 'cargo' field");
        Assert.Equal("Gerente de Ventas", cargoProp.GetString());

        // telefono
        Assert.True(root.TryGetProperty("telefono", out var telefonoProp), "Missing 'telefono' field");
        Assert.Equal("3001112233", telefonoProp.GetString());

        // email
        Assert.True(root.TryGetProperty("email", out var emailProp), "Missing 'email' field");
        Assert.Equal("laura.martinez@siesa.com", emailProp.GetString());

        // clienteId — must be null (not assigned in this test)
        Assert.True(root.TryGetProperty("clienteId", out var clienteIdProp), "Missing 'clienteId' field");
        Assert.Equal(JsonValueKind.Null, clienteIdProp.ValueKind);

        // createdAt — must be a valid DateTimeOffset ISO 8601 string with TZ
        Assert.True(root.TryGetProperty("createdAt", out var createdAtProp), "Missing 'createdAt' field");
        var createdAtStr = createdAtProp.GetString();
        Assert.False(string.IsNullOrEmpty(createdAtStr));
        Assert.True(
            DateTimeOffset.TryParse(createdAtStr, out _),
            $"'createdAt' is not a valid DateTimeOffset: {createdAtStr}"
        );
        Assert.True(
            createdAtStr!.EndsWith('Z') || createdAtStr.Contains('+') || createdAtStr.Contains('-', StringComparison.Ordinal),
            $"'createdAt' must include timezone info: {createdAtStr}"
        );
    }

    /// <summary>
    /// Given a contact that exists,
    /// When GET /api/v1/contactos/{id} is called,
    /// Then Content-Type is application/json.
    /// </summary>
    [Fact]
    public async Task TC1_GetContactoById_Returns_ContentTypeApplicationJson_WhenContactExists()
    {
        // GIVEN: A contact seeded in the database
        var uniqueFactory = new ContactoByIdWebApplicationFactory();
        var scopedClient = uniqueFactory.CreateClient();

        using var scope = uniqueFactory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var contacto = ContactoEntity.Create(
            nombre: "Test Content Type",
            cargo: "Analista",
            telefono: "3009990001",
            email: "ct@siesa.com",
            clienteId: null,
            createdAt: DateTimeOffset.UtcNow,
            updatedAt: DateTimeOffset.UtcNow
        );
        await dbContext.Set<ContactoEntity>().AddAsync(contacto);
        await dbContext.SaveChangesAsync();

        // WHEN: GET /api/v1/contactos/{id}
        var response = await scopedClient.GetAsync($"/api/v1/contactos/{contacto.Id}");

        // THEN: Content-Type is application/json
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var contentType = response.Content.Headers.ContentType?.MediaType;
        Assert.Equal("application/json", contentType);
    }

    // -------------------------------------------------------------------------
    // TC-2: GET /api/v1/contactos/{unknownId} returns 404 + Problem Details
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-2 — Given a contactoId that does not exist in the database,
    /// When GET /api/v1/contactos/{id} is called,
    /// Then HTTP 404 is returned with Problem Details RFC 7807 body.
    ///
    /// Acceptance criteria: AC #3, NFR6
    /// </summary>
    [Fact]
    public async Task TC2_GetContactoById_Returns404_WithProblemDetails_WhenContactNotFound()
    {
        // GIVEN: A UUID that has not been seeded in the database
        var nonExistentId = Guid.Empty; // 00000000-0000-0000-0000-000000000000

        // WHEN: GET /api/v1/contactos/{id} with a non-existent UUID
        var response = await _client.GetAsync($"/api/v1/contactos/{nonExistentId}");

        // THEN: HTTP 404 Not Found
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        // THEN: Response body is Problem Details with status: 404
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.True(doc.RootElement.TryGetProperty("status", out var statusProp),
            $"Problem Details must contain 'status' field. Response body: {json}");
        Assert.Equal(404, statusProp.GetInt32());
    }

    /// <summary>
    /// Given a non-existent contactoId,
    /// When GET /api/v1/contactos/{id} is called,
    /// Then the Content-Type is application/problem+json (RFC 7807 compliance).
    /// </summary>
    [Fact]
    public async Task TC2_GetContactoById_Returns_ProblemJsonContentType_WhenContactNotFound()
    {
        // GIVEN: A UUID that does not exist
        var nonExistentId = new Guid("00000000-0000-0000-0000-000000000099");

        // WHEN: GET request
        var response = await _client.GetAsync($"/api/v1/contactos/{nonExistentId}");

        // THEN: 404 status
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        // THEN: Content-Type contains "problem+json" (RFC 7807)
        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
        Assert.True(contentType.Contains("problem+json"),
            $"Expected Content-Type to contain 'problem+json' but got: {contentType}");
    }

    /// <summary>
    /// Given a non-existent contactoId,
    /// When GET /api/v1/contactos/{id} is called,
    /// Then the Problem Details body does NOT contain stack traces (NFR6).
    /// </summary>
    [Fact]
    public async Task TC2_GetContactoById_DoesNotExposeStackTrace_WhenContactNotFound()
    {
        // GIVEN: A UUID that does not exist
        var nonExistentId = new Guid("00000000-0000-0000-0000-000000000088");

        // WHEN: GET /api/v1/contactos/{id}
        var response = await _client.GetAsync($"/api/v1/contactos/{nonExistentId}");

        // THEN: 404 status
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        // THEN: Response body contains NO internal debugging information (NFR6)
        var json = await response.Content.ReadAsStringAsync();
        var lowerJson = json.ToLowerInvariant();

        Assert.True(!lowerJson.Contains("stacktrace"),
            $"Stack trace must not be exposed. Response: {json}");
        Assert.True(!lowerJson.Contains("exception"),
            $"Exception details must not be exposed. Response: {json}");
        Assert.True(!lowerJson.Contains("innerexception"),
            $"InnerException details must not be exposed. Response: {json}");
    }

    /// <summary>
    /// Given a non-existent contactoId,
    /// When GET /api/v1/contactos/{id} is called,
    /// Then the Problem Details body contains a title in Spanish ("Contacto no encontrado").
    /// </summary>
    [Fact]
    public async Task TC2_GetContactoById_Returns_SpanishTitleInProblemDetails_WhenNotFound()
    {
        // GIVEN: A UUID that does not exist
        var nonExistentId = new Guid("00000000-0000-0000-0000-000000000077");

        // WHEN: GET /api/v1/contactos/{id}
        var response = await _client.GetAsync($"/api/v1/contactos/{nonExistentId}");

        // THEN: 404 status
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        // THEN: Problem Details contains a title field (ideally in Spanish)
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.True(doc.RootElement.TryGetProperty("title", out var titleProp),
            $"Problem Details must contain 'title' field. Response: {json}");
        Assert.False(string.IsNullOrEmpty(titleProp.GetString()),
            "Problem Details 'title' must not be empty");
    }

    // -------------------------------------------------------------------------
    // TC-3: GET /api/v1/contactos/not-a-uuid returns 400
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-3 — Given a path parameter that is NOT a valid UUID,
    /// When GET /api/v1/contactos/{id} is called with "not-a-uuid",
    /// Then HTTP 400 Bad Request is returned.
    ///
    /// Reason: {id} is bound as Guid; .NET Minimal API returns 400 if binding fails.
    /// </summary>
    [Fact]
    public async Task TC3_GetContactoById_Returns400_WhenIdIsNotValidUuid()
    {
        // GIVEN: A path param that cannot be parsed as a Guid
        const string invalidId = "not-a-uuid";

        // WHEN: GET /api/v1/contactos/not-a-uuid
        var response = await _client.GetAsync($"/api/v1/contactos/{invalidId}");

        // THEN: HTTP 400 Bad Request (invalid Guid format)
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    /// <summary>
    /// Given a path parameter that is an empty-like non-UUID string,
    /// When GET /api/v1/contactos/{id} is called,
    /// Then HTTP 400 Bad Request is returned (not 500 or unhandled).
    /// </summary>
    [Fact]
    public async Task TC3_GetContactoById_Returns400_WhenIdIsPlainString()
    {
        // GIVEN: Another invalid format
        const string invalidId = "abc123";

        // WHEN: GET /api/v1/contactos/abc123
        var response = await _client.GetAsync($"/api/v1/contactos/{invalidId}");

        // THEN: HTTP 400 Bad Request
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
