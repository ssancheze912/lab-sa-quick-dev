/**
 * API Integration Tests — GET /api/v1/contactos?sinCliente=true
 * Story 4.5 — Orphan Contacts Filter (ATDD RED phase)
 *
 * Test IDs covered:
 *   TC-4.5-API-01  GET /api/v1/contactos?sinCliente=true returns 200 with only orphan contacts
 *   TC-4.5-API-02  GET /api/v1/contactos?sinCliente=false returns 200 with all contacts
 *   TC-4.5-API-03  GET /api/v1/contactos (no sinCliente param) returns all contacts (unchanged)
 *   TC-4.5-API-04  GET /api/v1/contactos?sinCliente=true when no orphans returns empty []
 *   TC-4.5-API-05  sinCliente=true does NOT return contacts with a non-null clienteId
 *   TC-4.5-API-06  sinCliente=invalid returns 400 Bad Request
 *
 * Stack: xUnit 2 + WebApplicationFactory<Program> + EF Core InMemory
 *
 * Expected RED failures (implementation not done yet):
 *   - GET /api/v1/contactos does not accept ?sinCliente query param yet
 *   - GetContactosQuery does not have SinCliente parameter yet
 *   - GetContactosQueryHandler does not apply WHERE cliente_id IS NULL filter yet
 *   - ContactosEndpoints.cs does not bind sinCliente query param yet
 *
 * Given-When-Then format per test method.
 */

using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Domain.Entities;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests.Contactos;

/// <summary>
/// Isolated WebApplicationFactory for Story 4.5 sinCliente filter tests.
/// Each test instance gets a unique in-memory database to prevent cross-test contamination.
/// </summary>
public sealed class ContactosSinClienteWebApplicationFactory : WebApplicationFactory<Program>
{
    public string DatabaseName { get; init; } = $"ContactosSinClienteTestDb_{Guid.NewGuid()}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
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
/// TC-4.5-API-01 through TC-4.5-API-06:
/// API integration tests for GET /api/v1/contactos?sinCliente=true.
/// </summary>
public sealed class ContactosSinClienteEndpointTests
{
    // -------------------------------------------------------------------------
    // TC-4.5-API-01: GET /api/v1/contactos?sinCliente=true returns only orphans
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-4.5-API-01 — Given 2 orphan contacts (clienteId=null) and 1 assigned contact,
    /// When GET /api/v1/contactos?sinCliente=true is called,
    /// Then HTTP 200 is returned with an array containing ONLY the 2 orphan contacts.
    ///
    /// Acceptance criteria: AC#1, AC#2 — FR25, AC-E4.5
    /// </summary>
    [Fact]
    public async Task TC1_GetContactos_SinClienteTrue_Returns200_WithOnlyOrphanContacts()
    {
        // GIVEN: 2 orphan contacts (clienteId=null) + 1 assigned contact (clienteId != null)
        var factory = new ContactosSinClienteWebApplicationFactory();
        var client = factory.CreateClient();

        var someClienteId = Guid.NewGuid();

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var orphan1 = ContactoEntity.Create(
            nombre: "Huerfano Uno",
            cargo: "Analista",
            telefono: "3001000001",
            email: "huerfano1@siesa.com",
            clienteId: null,
            createdAt: DateTimeOffset.UtcNow,
            updatedAt: DateTimeOffset.UtcNow
        );
        var orphan2 = ContactoEntity.Create(
            nombre: "Huerfano Dos",
            cargo: "Gerente",
            telefono: "3001000002",
            email: "huerfano2@siesa.com",
            clienteId: null,
            createdAt: DateTimeOffset.UtcNow,
            updatedAt: DateTimeOffset.UtcNow
        );
        var assigned = ContactoEntity.Create(
            nombre: "Asignado Uno",
            cargo: "Director",
            telefono: "3001000003",
            email: "asignado1@siesa.com",
            clienteId: someClienteId,
            createdAt: DateTimeOffset.UtcNow,
            updatedAt: DateTimeOffset.UtcNow
        );

        await dbContext.Set<ContactoEntity>().AddRangeAsync(orphan1, orphan2, assigned);
        await dbContext.SaveChangesAsync();

        // WHEN: GET /api/v1/contactos?sinCliente=true
        var response = await client.GetAsync("/api/v1/contactos?sinCliente=true");

        // THEN: HTTP 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // THEN: Response is a JSON array
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);

        // THEN: Array contains exactly 2 orphan contacts
        Assert.Equal(2, doc.RootElement.GetArrayLength());

        // THEN: Each item has clienteId = null
        foreach (var item in doc.RootElement.EnumerateArray())
        {
            Assert.True(item.TryGetProperty("clienteId", out var clienteIdProp),
                "Missing 'clienteId' field");
            Assert.Equal(JsonValueKind.Null, clienteIdProp.ValueKind);
        }

        // THEN: Assigned contact (clienteId != null) is NOT in the result
        var nombres = doc.RootElement.EnumerateArray()
            .Select(item => item.TryGetProperty("nombre", out var n) ? n.GetString() : null)
            .ToList();

        Assert.Contains("Huerfano Uno", nombres);
        Assert.Contains("Huerfano Dos", nombres);
        Assert.DoesNotContain("Asignado Uno", nombres);
    }

    /// <summary>
    /// TC-4.5-API-01b — Given 3 orphans,
    /// When GET /api/v1/contactos?sinCliente=true is called,
    /// Then HTTP 200 with Content-Type application/json.
    ///
    /// Verifies the response contract (shape) of the orphan filter.
    /// </summary>
    [Fact]
    public async Task TC1b_GetContactos_SinClienteTrue_Returns_CorrectDtoShape()
    {
        // GIVEN: One orphan contact seeded
        var factory = new ContactosSinClienteWebApplicationFactory();
        var client = factory.CreateClient();

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var orphan = ContactoEntity.Create(
            nombre: "Shape Test Huerfano",
            cargo: "QA",
            telefono: "3009001234",
            email: "shape.orphan@siesa.com",
            clienteId: null,
            createdAt: DateTimeOffset.UtcNow,
            updatedAt: DateTimeOffset.UtcNow
        );
        await dbContext.Set<ContactoEntity>().AddAsync(orphan);
        await dbContext.SaveChangesAsync();

        // WHEN: GET /api/v1/contactos?sinCliente=true
        var response = await client.GetAsync("/api/v1/contactos?sinCliente=true");

        // THEN: HTTP 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var contentType = response.Content.Headers.ContentType?.MediaType;
        Assert.Equal("application/json", contentType);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        Assert.True(doc.RootElement.GetArrayLength() >= 1);

        var item = doc.RootElement.EnumerateArray().First();

        // id — valid UUID
        Assert.True(item.TryGetProperty("id", out var idProp), "Missing 'id'");
        Assert.True(Guid.TryParse(idProp.GetString(), out _), $"'id' not a UUID: {idProp}");

        // nombre
        Assert.True(item.TryGetProperty("nombre", out var nombreProp), "Missing 'nombre'");
        Assert.Equal("Shape Test Huerfano", nombreProp.GetString());

        // cargo
        Assert.True(item.TryGetProperty("cargo", out _), "Missing 'cargo'");

        // email
        Assert.True(item.TryGetProperty("email", out var emailProp), "Missing 'email'");
        Assert.Equal("shape.orphan@siesa.com", emailProp.GetString());

        // clienteId — MUST be null for orphan contacts
        Assert.True(item.TryGetProperty("clienteId", out var clienteIdProp), "Missing 'clienteId'");
        Assert.Equal(JsonValueKind.Null, clienteIdProp.ValueKind);

        // createdAt — ISO 8601 with timezone
        Assert.True(item.TryGetProperty("createdAt", out var createdAtProp), "Missing 'createdAt'");
        var createdAtStr = createdAtProp.GetString();
        Assert.False(string.IsNullOrEmpty(createdAtStr));
        Assert.True(DateTimeOffset.TryParse(createdAtStr, out _),
            $"'createdAt' not a valid DateTimeOffset: {createdAtStr}");
    }

    // -------------------------------------------------------------------------
    // TC-4.5-API-02: GET /api/v1/contactos?sinCliente=false returns all contacts
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-4.5-API-02 — Given orphan and assigned contacts seeded,
    /// When GET /api/v1/contactos?sinCliente=false is called,
    /// Then HTTP 200 with ALL contacts (both orphan and assigned).
    ///
    /// Verifies that sinCliente=false behaves like the default (no filter).
    /// Acceptance criteria: AC#4 (deactivating the filter)
    /// </summary>
    [Fact]
    public async Task TC2_GetContactos_SinClienteFalse_Returns200_WithAllContacts()
    {
        // GIVEN: 1 orphan + 1 assigned contact
        var factory = new ContactosSinClienteWebApplicationFactory();
        var client = factory.CreateClient();

        var clienteId = Guid.NewGuid();

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var orphan = ContactoEntity.Create(
            nombre: "FalseParam Huerfano",
            cargo: "Analista",
            telefono: "3001000004",
            email: "falseparam.orphan@siesa.com",
            clienteId: null,
            createdAt: DateTimeOffset.UtcNow,
            updatedAt: DateTimeOffset.UtcNow
        );
        var assigned = ContactoEntity.Create(
            nombre: "FalseParam Asignado",
            cargo: "Director",
            telefono: "3001000005",
            email: "falseparam.assigned@siesa.com",
            clienteId: clienteId,
            createdAt: DateTimeOffset.UtcNow,
            updatedAt: DateTimeOffset.UtcNow
        );

        await dbContext.Set<ContactoEntity>().AddRangeAsync(orphan, assigned);
        await dbContext.SaveChangesAsync();

        // WHEN: GET /api/v1/contactos?sinCliente=false
        var response = await client.GetAsync("/api/v1/contactos?sinCliente=false");

        // THEN: HTTP 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // THEN: Both contacts are returned (no filter applied)
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        Assert.True(doc.RootElement.GetArrayLength() >= 2, "Expected at least 2 contacts when sinCliente=false");

        var nombres = doc.RootElement.EnumerateArray()
            .Select(item => item.TryGetProperty("nombre", out var n) ? n.GetString() : null)
            .ToList();

        Assert.Contains("FalseParam Huerfano", nombres);
        Assert.Contains("FalseParam Asignado", nombres);
    }

    // -------------------------------------------------------------------------
    // TC-4.5-API-03: GET /api/v1/contactos (no sinCliente param) returns all contacts
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-4.5-API-03 — Given orphan and assigned contacts,
    /// When GET /api/v1/contactos (no sinCliente param) is called,
    /// Then HTTP 200 with ALL contacts (existing behavior unchanged — no regression).
    ///
    /// Acceptance criteria: Story 4.5 must NOT break existing behavior.
    /// </summary>
    [Fact]
    public async Task TC3_GetContactos_NoSinClienteParam_Returns200_WithAllContacts_NoRegression()
    {
        // GIVEN: 1 orphan + 1 assigned
        var factory = new ContactosSinClienteWebApplicationFactory();
        var client = factory.CreateClient();

        var clienteId = Guid.NewGuid();

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var orphan = ContactoEntity.Create(
            nombre: "NoParam Huerfano",
            cargo: "Analista",
            telefono: "3001000006",
            email: "noparam.orphan@siesa.com",
            clienteId: null,
            createdAt: DateTimeOffset.UtcNow,
            updatedAt: DateTimeOffset.UtcNow
        );
        var assigned = ContactoEntity.Create(
            nombre: "NoParam Asignado",
            cargo: "Director",
            telefono: "3001000007",
            email: "noparam.assigned@siesa.com",
            clienteId: clienteId,
            createdAt: DateTimeOffset.UtcNow,
            updatedAt: DateTimeOffset.UtcNow
        );

        await dbContext.Set<ContactoEntity>().AddRangeAsync(orphan, assigned);
        await dbContext.SaveChangesAsync();

        // WHEN: GET /api/v1/contactos (no sinCliente param)
        var response = await client.GetAsync("/api/v1/contactos");

        // THEN: HTTP 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // THEN: All contacts returned (sinCliente=false is the default)
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        Assert.True(doc.RootElement.GetArrayLength() >= 2, "Expected all contacts when no sinCliente param");

        var nombres = doc.RootElement.EnumerateArray()
            .Select(item => item.TryGetProperty("nombre", out var n) ? n.GetString() : null)
            .ToList();

        Assert.Contains("NoParam Huerfano", nombres);
        Assert.Contains("NoParam Asignado", nombres);
    }

    // -------------------------------------------------------------------------
    // TC-4.5-API-04: sinCliente=true returns [] when no orphan contacts exist
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-4.5-API-04 — Given all contacts have a clienteId (no orphans),
    /// When GET /api/v1/contactos?sinCliente=true is called,
    /// Then HTTP 200 is returned with an empty array [].
    ///
    /// Acceptance criteria: AC#3 — EmptyState scenario.
    /// </summary>
    [Fact]
    public async Task TC4_GetContactos_SinClienteTrue_ReturnsEmptyArray_WhenNoOrphansExist()
    {
        // GIVEN: All contacts have a clienteId (no orphans)
        var factory = new ContactosSinClienteWebApplicationFactory();
        var client = factory.CreateClient();

        var clienteAId = Guid.NewGuid();
        var clienteBId = Guid.NewGuid();

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var assigned1 = ContactoEntity.Create(
            nombre: "Asignado A",
            cargo: "Gerente",
            telefono: "3001000008",
            email: "asignado.a@siesa.com",
            clienteId: clienteAId,
            createdAt: DateTimeOffset.UtcNow,
            updatedAt: DateTimeOffset.UtcNow
        );
        var assigned2 = ContactoEntity.Create(
            nombre: "Asignado B",
            cargo: "Analista",
            telefono: "3001000009",
            email: "asignado.b@siesa.com",
            clienteId: clienteBId,
            createdAt: DateTimeOffset.UtcNow,
            updatedAt: DateTimeOffset.UtcNow
        );

        await dbContext.Set<ContactoEntity>().AddRangeAsync(assigned1, assigned2);
        await dbContext.SaveChangesAsync();

        // WHEN: GET /api/v1/contactos?sinCliente=true
        var response = await client.GetAsync("/api/v1/contactos?sinCliente=true");

        // THEN: HTTP 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // THEN: Empty array (no orphans)
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        Assert.Equal(0, doc.RootElement.GetArrayLength());
    }

    // -------------------------------------------------------------------------
    // TC-4.5-API-05: sinCliente=true does NOT include assigned contacts
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-4.5-API-05 — Given 5 orphan contacts and 3 assigned contacts,
    /// When GET /api/v1/contactos?sinCliente=true is called,
    /// Then ONLY the 5 orphans are returned (never the 3 assigned ones).
    ///
    /// Acceptance criteria: AC#1 — strict filter enforcement.
    /// </summary>
    [Fact]
    public async Task TC5_GetContactos_SinClienteTrue_NeverIncludesAssignedContacts()
    {
        // GIVEN: 5 orphans + 3 assigned contacts
        var factory = new ContactosSinClienteWebApplicationFactory();
        var client = factory.CreateClient();

        var clienteId = Guid.NewGuid();

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var orphans = Enumerable.Range(1, 5).Select(i =>
            ContactoEntity.Create(
                nombre: $"Strict Orphan {i:D2}",
                cargo: "Analista",
                telefono: $"300100{i:D4}",
                email: $"strict.orphan{i}@siesa.com",
                clienteId: null,
                createdAt: DateTimeOffset.UtcNow,
                updatedAt: DateTimeOffset.UtcNow
            )
        ).ToList();

        var assigned = Enumerable.Range(1, 3).Select(i =>
            ContactoEntity.Create(
                nombre: $"Strict Assigned {i:D2}",
                cargo: "Director",
                telefono: $"300200{i:D4}",
                email: $"strict.assigned{i}@siesa.com",
                clienteId: clienteId,
                createdAt: DateTimeOffset.UtcNow,
                updatedAt: DateTimeOffset.UtcNow
            )
        ).ToList();

        await dbContext.Set<ContactoEntity>().AddRangeAsync([.. orphans, .. assigned]);
        await dbContext.SaveChangesAsync();

        // WHEN: GET /api/v1/contactos?sinCliente=true
        var response = await client.GetAsync("/api/v1/contactos?sinCliente=true");

        // THEN: HTTP 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);

        // THEN: Exactly 5 orphans returned
        Assert.Equal(5, doc.RootElement.GetArrayLength());

        // THEN: Every returned contact has clienteId = null
        foreach (var item in doc.RootElement.EnumerateArray())
        {
            Assert.True(item.TryGetProperty("clienteId", out var clienteIdProp),
                "Missing 'clienteId'");
            Assert.Equal(JsonValueKind.Null, clienteIdProp.ValueKind);
        }

        // THEN: No assigned contact names appear in the result
        var nombres = doc.RootElement.EnumerateArray()
            .Select(item => item.TryGetProperty("nombre", out var n) ? n.GetString() : null)
            .ToList();

        for (int i = 1; i <= 3; i++)
        {
            Assert.DoesNotContain($"Strict Assigned {i:D2}", nombres);
        }
    }

    // -------------------------------------------------------------------------
    // TC-4.5-API-06: sinCliente=invalid returns 400 Bad Request
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-4.5-API-06 — Given sinCliente query param is not a valid boolean,
    /// When GET /api/v1/contactos?sinCliente=invalid is called,
    /// Then HTTP 400 Bad Request is returned (not 500).
    ///
    /// Security: invalid params must be rejected gracefully.
    /// </summary>
    [Fact]
    public async Task TC6_GetContactos_SinClienteInvalid_Returns400_BadRequest()
    {
        // GIVEN: A non-boolean sinCliente query param
        var factory = new ContactosSinClienteWebApplicationFactory();
        var client = factory.CreateClient();

        // WHEN: GET /api/v1/contactos?sinCliente=invalid
        var response = await client.GetAsync("/api/v1/contactos?sinCliente=invalid");

        // THEN: HTTP 400 Bad Request (never 500)
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    /// <summary>
    /// Given sinCliente param is empty string,
    /// When GET /api/v1/contactos?sinCliente= is called,
    /// Then NOT 500 (no unhandled exception).
    ///
    /// Empty sinCliente could be treated as false (default behavior) or 400.
    /// Either is acceptable — 500 is not.
    /// </summary>
    [Fact]
    public async Task TC6b_GetContactos_SinClienteEmpty_DoesNotReturn500()
    {
        // GIVEN: An empty sinCliente param
        var factory = new ContactosSinClienteWebApplicationFactory();
        var client = factory.CreateClient();

        // WHEN: GET /api/v1/contactos?sinCliente=
        var response = await client.GetAsync("/api/v1/contactos?sinCliente=");

        // THEN: Not 500 (no unhandled exception)
        Assert.NotEqual(HttpStatusCode.InternalServerError, response.StatusCode);
    }
}
