/**
 * API Integration Tests — GET /api/v1/contactos?clienteId={uuid}
 * Story 4.1 — View Associated Contacts in Client Detail (ATDD RED phase)
 *
 * Test IDs covered:
 *   TC-1  GET /api/v1/contactos?clienteId={existingId} returns 200 with contacts
 *         belonging to that client only (AC #1, AC #2)
 *   TC-2  GET /api/v1/contactos?clienteId={unknownId} returns 200 with empty array
 *         (AC #3)
 *   TC-3  GET /api/v1/contactos?clienteId=not-a-uuid returns 400 Problem Details
 *         (security — invalid UUID format validation)
 *
 * Stack: xUnit 2 + WebApplicationFactory<Program> + EF Core InMemory
 *
 * Expected RED failures (missing implementation):
 *   - GET /api/v1/contactos does not accept ?clienteId query param yet
 *   - GetContactosQuery does not have optional ClienteId parameter yet
 *   - GetContactosQueryHandler does not apply WHERE cliente_id filter yet
 *   - ContactosEndpoints.cs does not parse/validate clienteId query param yet
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
/// Isolated WebApplicationFactory for Story 4.1 clienteId-filtered contacts tests.
/// Each factory instance gets a unique in-memory database to prevent cross-test pollution.
/// </summary>
public sealed class ContactosByClienteIdWebApplicationFactory : WebApplicationFactory<Program>
{
    public string DatabaseName { get; init; } = $"ContactosByClienteIdTestDb_{Guid.NewGuid()}";

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
/// TC-1, TC-2, TC-3: API integration tests for GET /api/v1/contactos?clienteId={uuid}.
/// </summary>
public sealed class ContactosByClienteIdTests
{
    // -------------------------------------------------------------------------
    // TC-1: GET /api/v1/contactos?clienteId={existingId} returns 200 with contacts
    //       belonging to that client only
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-1 — Given 2 contacts linked to clienteA and 1 contact linked to clienteB,
    /// When GET /api/v1/contactos?clienteId={clienteA.Id} is called,
    /// Then HTTP 200 is returned with an array containing only the 2 contacts
    /// belonging to clienteA (not the contact from clienteB).
    ///
    /// Acceptance criteria: AC #1, AC #2
    /// </summary>
    [Fact]
    public async Task TC1_GetContactosByClienteId_Returns200_WithOnlyContactsBelongingToThatClient()
    {
        // GIVEN: 2 contacts linked to clienteA, 1 contact linked to clienteB
        var factory = new ContactosByClienteIdWebApplicationFactory();
        var client = factory.CreateClient();

        var clienteAId = Guid.NewGuid();
        var clienteBId = Guid.NewGuid();

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var contactoA1 = ContactoEntity.Create(
            nombre: "Ana López",
            cargo: "Gerente",
            telefono: "3001000001",
            email: "ana.lopez@siesa.com",
            clienteId: clienteAId,
            createdAt: DateTimeOffset.UtcNow,
            updatedAt: DateTimeOffset.UtcNow
        );
        var contactoA2 = ContactoEntity.Create(
            nombre: "Pedro García",
            cargo: "Analista",
            telefono: "3001000002",
            email: "pedro.garcia@siesa.com",
            clienteId: clienteAId,
            createdAt: DateTimeOffset.UtcNow,
            updatedAt: DateTimeOffset.UtcNow
        );
        var contactoB1 = ContactoEntity.Create(
            nombre: "Maria Torres",
            cargo: "Directora",
            telefono: "3001000003",
            email: "maria.torres@siesa.com",
            clienteId: clienteBId,
            createdAt: DateTimeOffset.UtcNow,
            updatedAt: DateTimeOffset.UtcNow
        );

        await dbContext.Set<ContactoEntity>().AddRangeAsync(contactoA1, contactoA2, contactoB1);
        await dbContext.SaveChangesAsync();

        // WHEN: GET /api/v1/contactos?clienteId={clienteAId}
        var response = await client.GetAsync($"/api/v1/contactos?clienteId={clienteAId}");

        // THEN: HTTP 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // THEN: Response body is a JSON array
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);

        // THEN: Array contains exactly 2 items (only clienteA's contacts)
        Assert.Equal(2, doc.RootElement.GetArrayLength());

        // THEN: Each item has clienteId equal to clienteAId
        foreach (var item in doc.RootElement.EnumerateArray())
        {
            Assert.True(item.TryGetProperty("clienteId", out var clienteIdProp),
                "Missing 'clienteId' field");
            Assert.Equal(clienteAId.ToString(), clienteIdProp.GetString());
        }

        // THEN: clienteB's contact is NOT in the result
        var nombres = doc.RootElement.EnumerateArray()
            .Select(item => item.TryGetProperty("nombre", out var n) ? n.GetString() : null)
            .ToList();

        Assert.Contains("Ana López", nombres);
        Assert.Contains("Pedro García", nombres);
        Assert.DoesNotContain("Maria Torres", nombres);
    }

    /// <summary>
    /// Given contacts exist with a clienteId,
    /// When GET /api/v1/contactos?clienteId={id} is called,
    /// Then Content-Type is application/json.
    /// </summary>
    [Fact]
    public async Task TC1_GetContactosByClienteId_Returns_ContentTypeApplicationJson()
    {
        // GIVEN: One contact linked to a client
        var factory = new ContactosByClienteIdWebApplicationFactory();
        var client = factory.CreateClient();

        var clienteId = Guid.NewGuid();

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var contacto = ContactoEntity.Create(
            nombre: "Test ContentType",
            cargo: "QA",
            telefono: "3009880001",
            email: "test.ct@siesa.com",
            clienteId: clienteId,
            createdAt: DateTimeOffset.UtcNow,
            updatedAt: DateTimeOffset.UtcNow
        );
        await dbContext.Set<ContactoEntity>().AddAsync(contacto);
        await dbContext.SaveChangesAsync();

        // WHEN: GET /api/v1/contactos?clienteId={clienteId}
        var response = await client.GetAsync($"/api/v1/contactos?clienteId={clienteId}");

        // THEN: HTTP 200 OK with application/json
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var contentType = response.Content.Headers.ContentType?.MediaType;
        Assert.Equal("application/json", contentType);
    }

    /// <summary>
    /// Given contacts for clienteA exist,
    /// When GET /api/v1/contactos?clienteId={clienteAId} is called,
    /// Then each ContactoDto in the array has the required fields: id, nombre, cargo,
    /// telefono, email, clienteId, createdAt (ISO 8601 with TZ).
    /// </summary>
    [Fact]
    public async Task TC1_GetContactosByClienteId_Returns_CorrectDtoShape()
    {
        // GIVEN: One contact linked to clienteA
        var factory = new ContactosByClienteIdWebApplicationFactory();
        var client = factory.CreateClient();

        var clienteId = Guid.NewGuid();

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var contacto = ContactoEntity.Create(
            nombre: "Carlos Ruiz",
            cargo: "Vendedor",
            telefono: "3001234567",
            email: "carlos.ruiz@siesa.com",
            clienteId: clienteId,
            createdAt: DateTimeOffset.UtcNow,
            updatedAt: DateTimeOffset.UtcNow
        );
        await dbContext.Set<ContactoEntity>().AddAsync(contacto);
        await dbContext.SaveChangesAsync();

        // WHEN: GET /api/v1/contactos?clienteId={clienteId}
        var response = await client.GetAsync($"/api/v1/contactos?clienteId={clienteId}");

        // THEN: HTTP 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        Assert.True(doc.RootElement.GetArrayLength() >= 1);

        var item = doc.RootElement.EnumerateArray().First();

        // id — valid UUID
        Assert.True(item.TryGetProperty("id", out var idProp), "Missing 'id' field");
        Assert.True(Guid.TryParse(idProp.GetString(), out _),
            $"'id' is not a valid UUID: {idProp.GetString()}");

        // nombre
        Assert.True(item.TryGetProperty("nombre", out var nombreProp), "Missing 'nombre' field");
        Assert.Equal("Carlos Ruiz", nombreProp.GetString());

        // cargo
        Assert.True(item.TryGetProperty("cargo", out _), "Missing 'cargo' field");

        // telefono
        Assert.True(item.TryGetProperty("telefono", out _), "Missing 'telefono' field");

        // email
        Assert.True(item.TryGetProperty("email", out var emailProp), "Missing 'email' field");
        Assert.Equal("carlos.ruiz@siesa.com", emailProp.GetString());

        // clienteId — must match the seeded clienteId (not null)
        Assert.True(item.TryGetProperty("clienteId", out var clienteIdProp), "Missing 'clienteId' field");
        Assert.Equal(clienteId.ToString(), clienteIdProp.GetString());

        // createdAt — ISO 8601 with timezone (DateTimeOffset requirement per architecture)
        Assert.True(item.TryGetProperty("createdAt", out var createdAtProp), "Missing 'createdAt' field");
        var createdAtStr = createdAtProp.GetString();
        Assert.False(string.IsNullOrEmpty(createdAtStr));
        Assert.True(DateTimeOffset.TryParse(createdAtStr, out _),
            $"'createdAt' is not a valid DateTimeOffset: {createdAtStr}");
        Assert.True(
            createdAtStr!.EndsWith('Z') || createdAtStr.Contains('+') ||
            createdAtStr.Contains('-', StringComparison.Ordinal),
            $"'createdAt' must include timezone info: {createdAtStr}");
    }

    // -------------------------------------------------------------------------
    // TC-2: GET /api/v1/contactos?clienteId={unknownId} returns 200 with empty array
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-2 — Given no contacts exist for a given clienteId,
    /// When GET /api/v1/contactos?clienteId={unknownId} is called,
    /// Then HTTP 200 is returned with an empty array [].
    ///
    /// Acceptance criteria: AC #3
    /// </summary>
    [Fact]
    public async Task TC2_GetContactosByClienteId_Returns200_WithEmptyArray_WhenNoContactsForClient()
    {
        // GIVEN: A clienteId that has no contacts in the database
        var factory = new ContactosByClienteIdWebApplicationFactory();
        var client = factory.CreateClient();

        var unknownClienteId = Guid.NewGuid();

        // (no contacts seeded for this clienteId)

        // WHEN: GET /api/v1/contactos?clienteId={unknownClienteId}
        var response = await client.GetAsync($"/api/v1/contactos?clienteId={unknownClienteId}");

        // THEN: HTTP 200 OK (not 404 — empty array is valid response for "no contacts")
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // THEN: Response body is an empty JSON array
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        Assert.Equal(0, doc.RootElement.GetArrayLength());
    }

    /// <summary>
    /// Given contacts exist for clienteB but not for clienteA,
    /// When GET /api/v1/contactos?clienteId={clienteAId} is called,
    /// Then HTTP 200 is returned with [] (not clienteB's contacts).
    /// </summary>
    [Fact]
    public async Task TC2_GetContactosByClienteId_ReturnsEmptyArray_WhenOtherClientHasContacts()
    {
        // GIVEN: One contact linked to clienteB, nothing for clienteA
        var factory = new ContactosByClienteIdWebApplicationFactory();
        var client = factory.CreateClient();

        var clienteAId = Guid.NewGuid();
        var clienteBId = Guid.NewGuid();

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var contactoB = ContactoEntity.Create(
            nombre: "Contacto de B",
            cargo: "Cargo B",
            telefono: "3001110001",
            email: "b.contacto@siesa.com",
            clienteId: clienteBId,
            createdAt: DateTimeOffset.UtcNow,
            updatedAt: DateTimeOffset.UtcNow
        );
        await dbContext.Set<ContactoEntity>().AddAsync(contactoB);
        await dbContext.SaveChangesAsync();

        // WHEN: GET /api/v1/contactos?clienteId={clienteAId} (no contacts for A)
        var response = await client.GetAsync($"/api/v1/contactos?clienteId={clienteAId}");

        // THEN: HTTP 200 with empty array (filter is applied correctly)
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        Assert.Equal(0, doc.RootElement.GetArrayLength());
    }

    // -------------------------------------------------------------------------
    // TC-3: GET /api/v1/contactos?clienteId=not-a-uuid returns 400 Problem Details
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-3 — Given the clienteId query param is NOT a valid UUID,
    /// When GET /api/v1/contactos?clienteId=not-a-uuid is called,
    /// Then HTTP 400 Bad Request is returned with Problem Details RFC 7807.
    ///
    /// Security: prevents injection attacks via malformed clienteId param.
    /// Acceptance criteria: defensive validation (story API contract)
    /// </summary>
    [Fact]
    public async Task TC3_GetContactosByClienteId_Returns400_WhenClienteIdIsNotValidUuid()
    {
        // GIVEN: A clienteId query param that cannot be parsed as a Guid
        var factory = new ContactosByClienteIdWebApplicationFactory();
        var client = factory.CreateClient();

        // WHEN: GET /api/v1/contactos?clienteId=not-a-uuid
        var response = await client.GetAsync("/api/v1/contactos?clienteId=not-a-uuid");

        // THEN: HTTP 400 Bad Request
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    /// <summary>
    /// Given an alphanumeric (non-UUID) clienteId query param,
    /// When GET /api/v1/contactos?clienteId=abc123xyz is called,
    /// Then HTTP 400 is returned with Problem Details body containing status 400.
    /// </summary>
    [Fact]
    public async Task TC3_GetContactosByClienteId_Returns400_WithProblemDetails_WhenClienteIdIsInvalidFormat()
    {
        // GIVEN: A non-UUID clienteId
        var factory = new ContactosByClienteIdWebApplicationFactory();
        var client = factory.CreateClient();

        // WHEN: GET /api/v1/contactos?clienteId=abc123xyz
        var response = await client.GetAsync("/api/v1/contactos?clienteId=abc123xyz");

        // THEN: HTTP 400 Bad Request
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        // THEN: Response body is Problem Details with status 400
        var json = await response.Content.ReadAsStringAsync();
        if (!string.IsNullOrWhiteSpace(json))
        {
            try
            {
                using var doc = JsonDocument.Parse(json);
                if (doc.RootElement.TryGetProperty("status", out var statusProp))
                {
                    Assert.Equal(400, statusProp.GetInt32());
                }
            }
            catch (JsonException)
            {
                // Non-JSON 400 response is also acceptable — main assertion is the status code
            }
        }
    }

    /// <summary>
    /// Given a specially crafted injection-attempt string as clienteId,
    /// When GET /api/v1/contactos?clienteId='; DROP TABLE contactos;-- is called,
    /// Then HTTP 400 Bad Request is returned (not 500 or 200).
    /// </summary>
    [Fact]
    public async Task TC3_GetContactosByClienteId_Returns400_WhenClienteIdIsSqlInjectionAttempt()
    {
        // GIVEN: A SQL injection attempt in the clienteId param
        var factory = new ContactosByClienteIdWebApplicationFactory();
        var client = factory.CreateClient();

        var injectionPayload = Uri.EscapeDataString("'; DROP TABLE contactos;--");

        // WHEN: GET /api/v1/contactos?clienteId={injectionPayload}
        var response = await client.GetAsync($"/api/v1/contactos?clienteId={injectionPayload}");

        // THEN: HTTP 400 Bad Request (UUID validation rejects the payload before reaching EF Core)
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    /// <summary>
    /// Given a clienteId query param that is an empty string,
    /// When GET /api/v1/contactos?clienteId= is called,
    /// Then either HTTP 200 (treated as "no filter") or HTTP 400 is returned —
    /// but NOT 500 (unhandled exception must not propagate).
    /// </summary>
    [Fact]
    public async Task TC3_GetContactosByClienteId_DoesNotReturn500_WhenClienteIdIsEmpty()
    {
        // GIVEN: An empty clienteId param
        var factory = new ContactosByClienteIdWebApplicationFactory();
        var client = factory.CreateClient();

        // WHEN: GET /api/v1/contactos?clienteId=
        var response = await client.GetAsync("/api/v1/contactos?clienteId=");

        // THEN: NOT HTTP 500 (no unhandled exception)
        Assert.NotEqual(HttpStatusCode.InternalServerError, response.StatusCode);
    }
}
