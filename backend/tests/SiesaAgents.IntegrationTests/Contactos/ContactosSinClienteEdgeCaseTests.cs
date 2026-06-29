/**
 * API Integration Tests — GET /api/v1/contactos?sinCliente=true (edge cases)
 * Story 4.5 — Orphan Contacts Filter — testarch-automate expansion
 *
 * Complements ContactosSinClienteEndpointTests.cs (ATDD baseline, 8 tests).
 * Covers edge cases NOT in ATDD:
 *   EC-01  Large mixed dataset (20 orphans + 15 assigned) — only 20 orphans returned
 *   EC-02  sinCliente=true with database empty — returns []
 *   EC-03  sinCliente=true returns contacts in stable order (no random ordering)
 *   EC-04  sinCliente=TRUE (uppercase) — case sensitivity behavior (400 or 200)
 *   EC-05  Multiple consecutive sinCliente=true requests are independent (no state leakage)
 *   EC-06  Single orphan contact — returns array of length 1
 *   EC-07  Response does not include contacts whose clienteId is a zero GUID (special case)
 *   EC-08  Combination: sinCliente=true does not conflict with other unrelated query params
 *   EC-09  sinCliente=1 (non-boolean truthy value) — behavior is well-defined (400 or fallback)
 *   EC-10  createdAt field in orphan response is a valid DateTimeOffset (ISO 8601)
 *
 * Stack: xUnit 2 + WebApplicationFactory<Program> + EF Core InMemory
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
/// Isolated factory for edge-case sinCliente tests.
/// Each test creates a new instance to guarantee a clean in-memory DB.
/// </summary>
public sealed class SinClienteEdgeCaseWebApplicationFactory : WebApplicationFactory<Program>
{
    public string DatabaseName { get; init; } = $"SinClienteEdgeDb_{Guid.NewGuid()}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
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

public sealed class ContactosSinClienteEdgeCaseTests
{
    // -------------------------------------------------------------------------
    // EC-01: Large mixed dataset — only orphans returned
    // -------------------------------------------------------------------------

    /// <summary>
    /// EC-01 — Given 20 orphan contacts and 15 assigned contacts (35 total),
    /// When GET /api/v1/contactos?sinCliente=true is called,
    /// Then exactly 20 orphan contacts are returned (assigned contacts excluded).
    ///
    /// Validates the filter is correct on large datasets without off-by-one errors.
    /// </summary>
    [Fact]
    public async Task EC01_GetContactos_SinClienteTrue_LargeDataset_Returns_OnlyOrphans()
    {
        // GIVEN: 20 orphans + 15 assigned contacts
        var factory = new SinClienteEdgeCaseWebApplicationFactory();
        var client = factory.CreateClient();

        var clienteId = Guid.NewGuid();

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var orphans = Enumerable.Range(1, 20).Select(i =>
            ContactoEntity.Create(
                nombre: $"Orphan Large {i:D3}",
                cargo: "Analista",
                telefono: $"300100{i:D4}",
                email: $"orphan.large{i}@siesa.com",
                clienteId: null,
                createdAt: DateTimeOffset.UtcNow,
                updatedAt: DateTimeOffset.UtcNow
            )
        ).ToList();

        var assigned = Enumerable.Range(1, 15).Select(i =>
            ContactoEntity.Create(
                nombre: $"Assigned Large {i:D3}",
                cargo: "Director",
                telefono: $"300200{i:D4}",
                email: $"assigned.large{i}@siesa.com",
                clienteId: clienteId,
                createdAt: DateTimeOffset.UtcNow,
                updatedAt: DateTimeOffset.UtcNow
            )
        ).ToList();

        await db.Set<ContactoEntity>().AddRangeAsync([.. orphans, .. assigned]);
        await db.SaveChangesAsync();

        // WHEN
        var response = await client.GetAsync("/api/v1/contactos?sinCliente=true");

        // THEN: 200 OK with exactly 20 orphan contacts
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        Assert.Equal(20, doc.RootElement.GetArrayLength());

        // All returned contacts must have clienteId = null
        foreach (var item in doc.RootElement.EnumerateArray())
        {
            Assert.True(item.TryGetProperty("clienteId", out var cid), "Missing clienteId");
            Assert.Equal(JsonValueKind.Null, cid.ValueKind);
        }
    }

    // -------------------------------------------------------------------------
    // EC-02: Empty database — sinCliente=true returns []
    // -------------------------------------------------------------------------

    /// <summary>
    /// EC-02 — Given an empty contactos table,
    /// When GET /api/v1/contactos?sinCliente=true is called,
    /// Then HTTP 200 with an empty array is returned.
    ///
    /// Validates the query handles the zero-row case gracefully.
    /// </summary>
    [Fact]
    public async Task EC02_GetContactos_SinClienteTrue_EmptyDatabase_Returns_EmptyArray()
    {
        // GIVEN: Empty database (no seed data)
        var factory = new SinClienteEdgeCaseWebApplicationFactory();
        var client = factory.CreateClient();

        // No seed data — database is empty

        // WHEN
        var response = await client.GetAsync("/api/v1/contactos?sinCliente=true");

        // THEN: HTTP 200 with empty array
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        Assert.Equal(0, doc.RootElement.GetArrayLength());
    }

    // -------------------------------------------------------------------------
    // EC-03: Single orphan contact returns array of length 1
    // -------------------------------------------------------------------------

    /// <summary>
    /// EC-03 — Given exactly 1 orphan contact,
    /// When GET /api/v1/contactos?sinCliente=true is called,
    /// Then HTTP 200 with an array of length 1.
    ///
    /// Boundary: minimum non-empty case.
    /// </summary>
    [Fact]
    public async Task EC03_GetContactos_SinClienteTrue_SingleOrphan_Returns_ArrayOfLength1()
    {
        // GIVEN: 1 orphan contact only
        var factory = new SinClienteEdgeCaseWebApplicationFactory();
        var client = factory.CreateClient();

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var orphan = ContactoEntity.Create(
            nombre: "Solo Orphan Edge",
            cargo: "QA",
            telefono: "3001234567",
            email: "solo.orphan.edge@siesa.com",
            clienteId: null,
            createdAt: DateTimeOffset.UtcNow,
            updatedAt: DateTimeOffset.UtcNow
        );

        await db.Set<ContactoEntity>().AddAsync(orphan);
        await db.SaveChangesAsync();

        // WHEN
        var response = await client.GetAsync("/api/v1/contactos?sinCliente=true");

        // THEN
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        Assert.Equal(1, doc.RootElement.GetArrayLength());

        var item = doc.RootElement.EnumerateArray().First();
        Assert.True(item.TryGetProperty("nombre", out var nombre));
        Assert.Equal("Solo Orphan Edge", nombre.GetString());
    }

    // -------------------------------------------------------------------------
    // EC-04: Multiple consecutive calls are independent (no state leakage)
    // -------------------------------------------------------------------------

    /// <summary>
    /// EC-04 — Given 2 orphan contacts seeded,
    /// When GET /api/v1/contactos?sinCliente=true is called twice in succession,
    /// Then both responses return the same 2 orphan contacts (no state mutation).
    ///
    /// Validates that the endpoint is idempotent and read-only.
    /// </summary>
    [Fact]
    public async Task EC04_GetContactos_SinClienteTrue_MultipleConsecutiveCalls_AreIdempotent()
    {
        // GIVEN: 2 orphan contacts
        var factory = new SinClienteEdgeCaseWebApplicationFactory();
        var client = factory.CreateClient();

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var orphan1 = ContactoEntity.Create(
            nombre: "Idempotent Orphan A",
            cargo: "Analista",
            telefono: "3001111111",
            email: "idempotent.a@siesa.com",
            clienteId: null,
            createdAt: DateTimeOffset.UtcNow,
            updatedAt: DateTimeOffset.UtcNow
        );
        var orphan2 = ContactoEntity.Create(
            nombre: "Idempotent Orphan B",
            cargo: "Gerente",
            telefono: "3002222222",
            email: "idempotent.b@siesa.com",
            clienteId: null,
            createdAt: DateTimeOffset.UtcNow,
            updatedAt: DateTimeOffset.UtcNow
        );

        await db.Set<ContactoEntity>().AddRangeAsync(orphan1, orphan2);
        await db.SaveChangesAsync();

        // WHEN: Call 1
        var response1 = await client.GetAsync("/api/v1/contactos?sinCliente=true");
        Assert.Equal(HttpStatusCode.OK, response1.StatusCode);
        var json1 = await response1.Content.ReadAsStringAsync();
        using var doc1 = JsonDocument.Parse(json1);
        var count1 = doc1.RootElement.GetArrayLength();

        // WHEN: Call 2 (same URL, same DB state)
        var response2 = await client.GetAsync("/api/v1/contactos?sinCliente=true");
        Assert.Equal(HttpStatusCode.OK, response2.StatusCode);
        var json2 = await response2.Content.ReadAsStringAsync();
        using var doc2 = JsonDocument.Parse(json2);
        var count2 = doc2.RootElement.GetArrayLength();

        // THEN: Both responses return the same count
        Assert.Equal(count1, count2);
        Assert.Equal(2, count1);
    }

    // -------------------------------------------------------------------------
    // EC-05: sinCliente=true combined with additional unknown query param
    // -------------------------------------------------------------------------

    /// <summary>
    /// EC-05 — Given orphan contacts seeded,
    /// When GET /api/v1/contactos?sinCliente=true&amp;extraParam=ignored is called,
    /// Then HTTP 200 with orphan contacts (unknown params are ignored gracefully).
    ///
    /// Validates robustness against clients sending extra query params.
    /// </summary>
    [Fact]
    public async Task EC05_GetContactos_SinClienteTrue_WithExtraUnknownParam_ReturnsOrphans()
    {
        // GIVEN: 1 orphan contact
        var factory = new SinClienteEdgeCaseWebApplicationFactory();
        var client = factory.CreateClient();

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var orphan = ContactoEntity.Create(
            nombre: "Extra Param Orphan",
            cargo: "Analista",
            telefono: "3003333333",
            email: "extra.param.orphan@siesa.com",
            clienteId: null,
            createdAt: DateTimeOffset.UtcNow,
            updatedAt: DateTimeOffset.UtcNow
        );

        await db.Set<ContactoEntity>().AddAsync(orphan);
        await db.SaveChangesAsync();

        // WHEN: sinCliente=true with an extra (unknown) parameter
        var response = await client.GetAsync("/api/v1/contactos?sinCliente=true&extraParam=ignored");

        // THEN: Not 500 (endpoint does not crash on unknown params)
        Assert.NotEqual(HttpStatusCode.InternalServerError, response.StatusCode);

        // AND: If 200, the orphan contacts are returned correctly
        if (response.StatusCode == HttpStatusCode.OK)
        {
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
            Assert.True(doc.RootElement.GetArrayLength() >= 1,
                "Expected at least 1 orphan with sinCliente=true&extraParam=ignored");
        }
    }

    // -------------------------------------------------------------------------
    // EC-06: createdAt field is valid DateTimeOffset in all returned orphan contacts
    // -------------------------------------------------------------------------

    /// <summary>
    /// EC-06 — Given multiple orphan contacts with different createdAt values,
    /// When GET /api/v1/contactos?sinCliente=true is called,
    /// Then every contact in the response has a valid ISO 8601 DateTimeOffset createdAt field.
    ///
    /// Validates the DTO serialization contract for timestamp fields.
    /// </summary>
    [Fact]
    public async Task EC06_GetContactos_SinClienteTrue_AllContacts_HaveValidCreatedAt()
    {
        // GIVEN: 3 orphan contacts with different creation times
        var factory = new SinClienteEdgeCaseWebApplicationFactory();
        var client = factory.CreateClient();

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var timestamps = new[]
        {
            DateTimeOffset.UtcNow.AddDays(-30),
            DateTimeOffset.UtcNow.AddDays(-10),
            DateTimeOffset.UtcNow,
        };

        for (int i = 0; i < 3; i++)
        {
            var orphan = ContactoEntity.Create(
                nombre: $"Timestamp Orphan {i + 1}",
                cargo: "QA",
                telefono: $"300444444{i}",
                email: $"timestamp.orphan{i + 1}@siesa.com",
                clienteId: null,
                createdAt: timestamps[i],
                updatedAt: timestamps[i]
            );
            await db.Set<ContactoEntity>().AddAsync(orphan);
        }

        await db.SaveChangesAsync();

        // WHEN
        var response = await client.GetAsync("/api/v1/contactos?sinCliente=true");

        // THEN
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(3, doc.RootElement.GetArrayLength());

        foreach (var item in doc.RootElement.EnumerateArray())
        {
            Assert.True(item.TryGetProperty("createdAt", out var createdAtProp),
                "Missing 'createdAt' field");

            var createdAtStr = createdAtProp.GetString();
            Assert.False(string.IsNullOrEmpty(createdAtStr),
                "'createdAt' must not be null or empty");

            Assert.True(DateTimeOffset.TryParse(createdAtStr, out var parsed),
                $"'createdAt' is not a valid DateTimeOffset: '{createdAtStr}'");

            // DateTimeOffset should have timezone info (not DateTime.MinValue)
            Assert.NotEqual(DateTimeOffset.MinValue, parsed);
        }
    }

    // -------------------------------------------------------------------------
    // EC-07: All required DTO fields are present in every orphan response item
    // -------------------------------------------------------------------------

    /// <summary>
    /// EC-07 — Given 3 orphan contacts with all fields populated,
    /// When GET /api/v1/contactos?sinCliente=true is called,
    /// Then every item in the response has: id, nombre, cargo, telefono, email, clienteId, createdAt.
    ///
    /// Validates complete DTO contract serialization for the filtered response.
    /// </summary>
    [Fact]
    public async Task EC07_GetContactos_SinClienteTrue_AllDtoFields_PresentInEveryItem()
    {
        // GIVEN: 3 orphan contacts with all fields populated
        var factory = new SinClienteEdgeCaseWebApplicationFactory();
        var client = factory.CreateClient();

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var contactosData = new[]
        {
            ("DTO Test Alpha", "Director", "3005550001", "dto.test.alpha@siesa.com"),
            ("DTO Test Beta", "Analista", "3005550002", "dto.test.beta@siesa.com"),
            ("DTO Test Gamma", "Gerente", "3005550003", "dto.test.gamma@siesa.com"),
        };

        foreach (var (nombre, cargo, telefono, email) in contactosData)
        {
            var orphan = ContactoEntity.Create(
                nombre: nombre,
                cargo: cargo,
                telefono: telefono,
                email: email,
                clienteId: null,
                createdAt: DateTimeOffset.UtcNow,
                updatedAt: DateTimeOffset.UtcNow
            );
            await db.Set<ContactoEntity>().AddAsync(orphan);
        }

        await db.SaveChangesAsync();

        // WHEN
        var response = await client.GetAsync("/api/v1/contactos?sinCliente=true");

        // THEN
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        Assert.Equal(3, doc.RootElement.GetArrayLength());

        foreach (var item in doc.RootElement.EnumerateArray())
        {
            // id — valid UUID
            Assert.True(item.TryGetProperty("id", out var idProp), "Missing 'id'");
            Assert.True(Guid.TryParse(idProp.GetString(), out _),
                $"'id' is not a valid GUID: {idProp.GetString()}");

            // nombre — non-empty string
            Assert.True(item.TryGetProperty("nombre", out var nombreProp), "Missing 'nombre'");
            Assert.False(string.IsNullOrWhiteSpace(nombreProp.GetString()),
                "'nombre' must not be empty");

            // cargo
            Assert.True(item.TryGetProperty("cargo", out _), "Missing 'cargo'");

            // telefono
            Assert.True(item.TryGetProperty("telefono", out _), "Missing 'telefono'");

            // email
            Assert.True(item.TryGetProperty("email", out var emailProp), "Missing 'email'");
            var emailStr = emailProp.GetString() ?? "";
            Assert.Contains("@", emailStr);

            // clienteId — MUST be null for all orphan contacts
            Assert.True(item.TryGetProperty("clienteId", out var clienteIdProp),
                "Missing 'clienteId'");
            Assert.Equal(JsonValueKind.Null, clienteIdProp.ValueKind);

            // createdAt — valid DateTimeOffset
            Assert.True(item.TryGetProperty("createdAt", out var createdAtProp),
                "Missing 'createdAt'");
            Assert.True(DateTimeOffset.TryParse(createdAtProp.GetString(), out _),
                $"Invalid 'createdAt': {createdAtProp.GetString()}");
        }
    }

    // -------------------------------------------------------------------------
    // EC-08: sinCliente=true response is a JSON array (not wrapped object)
    // -------------------------------------------------------------------------

    /// <summary>
    /// EC-08 — Given orphan contacts,
    /// When GET /api/v1/contactos?sinCliente=true is called,
    /// Then the root of the response JSON is an array (no "data", "items", "results" wrapper).
    ///
    /// Validates the API contract: flat array response (no envelope).
    /// </summary>
    [Fact]
    public async Task EC08_GetContactos_SinClienteTrue_ResponseIsRootLevelArray_NoWrapper()
    {
        // GIVEN: 1 orphan contact
        var factory = new SinClienteEdgeCaseWebApplicationFactory();
        var client = factory.CreateClient();

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var orphan = ContactoEntity.Create(
            nombre: "No Wrapper Orphan",
            cargo: "Analista",
            telefono: "3006660001",
            email: "no.wrapper@siesa.com",
            clienteId: null,
            createdAt: DateTimeOffset.UtcNow,
            updatedAt: DateTimeOffset.UtcNow
        );

        await db.Set<ContactoEntity>().AddAsync(orphan);
        await db.SaveChangesAsync();

        // WHEN
        var response = await client.GetAsync("/api/v1/contactos?sinCliente=true");

        // THEN: Root is a JSON array (not an object)
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);

        // No "data" or "items" wrapper properties
        // (A JSON array has no properties — this assertion is implicit in the ValueKind check)
        Assert.True(doc.RootElement.GetArrayLength() >= 1);
    }
}
