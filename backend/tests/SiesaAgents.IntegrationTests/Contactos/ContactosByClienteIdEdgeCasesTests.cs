/**
 * API Integration Tests — GET /api/v1/contactos?clienteId edge cases & boundary conditions
 * Story 4.1 — View Associated Contacts in Client Detail
 *
 * Expands ATDD coverage with:
 *   EC-1  Contacts with null clienteId are NOT returned when filtering by a clienteId
 *   EC-2  Response is ordered descending by createdAt (repository contract)
 *   EC-3  Large dataset: 25 contacts for clienteA all returned (no accidental pagination)
 *   EC-4  GET /api/v1/contactos (no clienteId param) returns all contacts
 *   EC-5  Whitespace-only clienteId returns 400 (not 500)
 *   EC-6  clienteId with uppercase hex UUID is accepted (case-insensitive UUID parsing)
 *   EC-7  createdAt field is DateTimeOffset (timezone suffix required per architecture)
 *   EC-8  Concurrent requests for same clienteId both return correct results
 *
 * Stack: xUnit 2 + WebApplicationFactory<Program> + EF Core InMemory
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
/// Edge case tests for GET /api/v1/contactos?clienteId={uuid}.
/// Each test gets its own factory instance with a unique in-memory database.
/// </summary>
public sealed class ContactosByClienteIdEdgeCasesTests
{
    // -------------------------------------------------------------------------
    // EC-1: Contacts with null clienteId do NOT appear in filtered results
    // -------------------------------------------------------------------------

    /// <summary>
    /// EC-1 — Given contacts with null clienteId (orphans) exist alongside contacts
    /// linked to clienteA, When GET /api/v1/contactos?clienteId={clienteAId} is called,
    /// Then only the contacts belonging to clienteA are returned (not the orphans).
    /// </summary>
    [Fact]
    public async Task EC1_GetContactosByClienteId_DoesNotReturn_OrphanContacts_WithNullClienteId()
    {
        // GIVEN: 2 contacts linked to clienteA, 1 orphan contact (null clienteId)
        var factory = new ContactosByClienteIdWebApplicationFactory();
        var client = factory.CreateClient();

        var clienteAId = Guid.NewGuid();

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var contactoA1 = ContactoEntity.Create(
            nombre: "Contacto Vinculado 1",
            cargo: "Cargo A",
            telefono: "3001000001",
            email: "linked1@siesa.com",
            clienteId: clienteAId,
            createdAt: DateTimeOffset.UtcNow,
            updatedAt: DateTimeOffset.UtcNow
        );
        var contactoA2 = ContactoEntity.Create(
            nombre: "Contacto Vinculado 2",
            cargo: "Cargo A2",
            telefono: "3001000002",
            email: "linked2@siesa.com",
            clienteId: clienteAId,
            createdAt: DateTimeOffset.UtcNow,
            updatedAt: DateTimeOffset.UtcNow
        );
        var orphan = ContactoEntity.Create(
            nombre: "Contacto Huerfano",
            cargo: "Sin cliente",
            telefono: "3001000099",
            email: "orphan@siesa.com",
            clienteId: null,  // no client association
            createdAt: DateTimeOffset.UtcNow,
            updatedAt: DateTimeOffset.UtcNow
        );

        await dbContext.Set<ContactoEntity>().AddRangeAsync(contactoA1, contactoA2, orphan);
        await dbContext.SaveChangesAsync();

        // WHEN: GET /api/v1/contactos?clienteId={clienteAId}
        var response = await client.GetAsync($"/api/v1/contactos?clienteId={clienteAId}");

        // THEN: HTTP 200
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);

        // THEN: Only 2 items returned (orphan excluded)
        Assert.Equal(2, doc.RootElement.GetArrayLength());

        // THEN: Orphan contact is not in the results
        var nombres = doc.RootElement.EnumerateArray()
            .Select(item => item.TryGetProperty("nombre", out var n) ? n.GetString() : null)
            .ToList();
        Assert.DoesNotContain("Contacto Huerfano", nombres);
    }

    // -------------------------------------------------------------------------
    // EC-2: Response is ordered descending by createdAt
    // -------------------------------------------------------------------------

    /// <summary>
    /// EC-2 — Given 3 contacts for clienteA created at different times,
    /// When GET /api/v1/contactos?clienteId={clienteAId} is called,
    /// Then the most recently created contact appears first in the array.
    /// </summary>
    [Fact]
    public async Task EC2_GetContactosByClienteId_ReturnsContacts_OrderedByCreatedAtDescending()
    {
        // GIVEN: 3 contacts with explicit createdAt timestamps spread over 3 days
        var factory = new ContactosByClienteIdWebApplicationFactory();
        var client = factory.CreateClient();

        var clienteAId = Guid.NewGuid();
        var baseTime = DateTimeOffset.UtcNow;

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var oldest = ContactoEntity.Create(
            nombre: "Mas Antiguo",
            cargo: "Cargo1",
            telefono: "3001000001",
            email: "oldest@siesa.com",
            clienteId: clienteAId,
            createdAt: baseTime.AddDays(-2),
            updatedAt: baseTime.AddDays(-2)
        );
        var middle = ContactoEntity.Create(
            nombre: "Intermedio",
            cargo: "Cargo2",
            telefono: "3001000002",
            email: "middle@siesa.com",
            clienteId: clienteAId,
            createdAt: baseTime.AddDays(-1),
            updatedAt: baseTime.AddDays(-1)
        );
        var newest = ContactoEntity.Create(
            nombre: "Mas Reciente",
            cargo: "Cargo3",
            telefono: "3001000003",
            email: "newest@siesa.com",
            clienteId: clienteAId,
            createdAt: baseTime,
            updatedAt: baseTime
        );

        // Seed in reverse order to ensure ordering is by column, not insert order
        await dbContext.Set<ContactoEntity>().AddRangeAsync(oldest, middle, newest);
        await dbContext.SaveChangesAsync();

        // WHEN: GET /api/v1/contactos?clienteId={clienteAId}
        var response = await client.GetAsync($"/api/v1/contactos?clienteId={clienteAId}");

        // THEN: HTTP 200 with 3 items
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(3, doc.RootElement.GetArrayLength());

        // THEN: First item is the most recent
        var items = doc.RootElement.EnumerateArray().ToList();
        var firstNombre = items[0].TryGetProperty("nombre", out var n) ? n.GetString() : null;
        Assert.Equal("Mas Reciente", firstNombre);

        // THEN: Last item is the oldest
        var lastNombre = items[2].TryGetProperty("nombre", out var n2) ? n2.GetString() : null;
        Assert.Equal("Mas Antiguo", lastNombre);
    }

    // -------------------------------------------------------------------------
    // EC-3: Large dataset — 25 contacts all returned (no accidental pagination)
    // -------------------------------------------------------------------------

    /// <summary>
    /// EC-3 — Given 25 contacts for clienteA exist in the database,
    /// When GET /api/v1/contactos?clienteId={clienteAId} is called,
    /// Then all 25 contacts are returned in a single response.
    /// </summary>
    [Fact]
    public async Task EC3_GetContactosByClienteId_ReturnsAllContacts_WhenLargeDataset()
    {
        // GIVEN: 25 contacts for clienteA
        var factory = new ContactosByClienteIdWebApplicationFactory();
        var client = factory.CreateClient();

        var clienteAId = Guid.NewGuid();

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var contacts = Enumerable.Range(1, 25).Select(i => ContactoEntity.Create(
            nombre: $"Contacto {i:D2}",
            cargo: $"Cargo {i:D2}",
            telefono: $"30010{i:D5}",
            email: $"contacto{i:D2}@siesa.com",
            clienteId: clienteAId,
            createdAt: DateTimeOffset.UtcNow.AddMinutes(-i),
            updatedAt: DateTimeOffset.UtcNow.AddMinutes(-i)
        )).ToList();

        await dbContext.Set<ContactoEntity>().AddRangeAsync(contacts);
        await dbContext.SaveChangesAsync();

        // WHEN: GET /api/v1/contactos?clienteId={clienteAId}
        var response = await client.GetAsync($"/api/v1/contactos?clienteId={clienteAId}");

        // THEN: HTTP 200 with all 25 items (no pagination applied)
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        Assert.Equal(25, doc.RootElement.GetArrayLength());
    }

    // -------------------------------------------------------------------------
    // EC-4: GET /api/v1/contactos (no clienteId param) returns ALL contacts
    // -------------------------------------------------------------------------

    /// <summary>
    /// EC-4 — Given contacts for two different clients exist,
    /// When GET /api/v1/contactos (no clienteId query param) is called,
    /// Then all contacts are returned regardless of their clienteId.
    /// </summary>
    [Fact]
    public async Task EC4_GetContactos_WithoutClienteIdParam_ReturnsAllContacts()
    {
        // GIVEN: 1 contact for clienteA, 1 contact for clienteB, 1 orphan
        var factory = new ContactosByClienteIdWebApplicationFactory();
        var client = factory.CreateClient();

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var contactoA = ContactoEntity.Create("Contacto A", "Cargo A", "3001000001", "a@siesa.com",
            clienteId: Guid.NewGuid(), createdAt: DateTimeOffset.UtcNow, updatedAt: DateTimeOffset.UtcNow);
        var contactoB = ContactoEntity.Create("Contacto B", "Cargo B", "3001000002", "b@siesa.com",
            clienteId: Guid.NewGuid(), createdAt: DateTimeOffset.UtcNow, updatedAt: DateTimeOffset.UtcNow);
        var orphan = ContactoEntity.Create("Orphan", "Orphan Cargo", "3001000003", "orphan@siesa.com",
            clienteId: null, createdAt: DateTimeOffset.UtcNow, updatedAt: DateTimeOffset.UtcNow);

        await dbContext.Set<ContactoEntity>().AddRangeAsync(contactoA, contactoB, orphan);
        await dbContext.SaveChangesAsync();

        // WHEN: GET /api/v1/contactos (no filter)
        var response = await client.GetAsync("/api/v1/contactos");

        // THEN: HTTP 200 with all 3 contacts
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        Assert.Equal(3, doc.RootElement.GetArrayLength());
    }

    // -------------------------------------------------------------------------
    // EC-5: Whitespace-only clienteId returns 400 (not 500)
    // -------------------------------------------------------------------------

    /// <summary>
    /// EC-5 — Given a clienteId query param containing only whitespace,
    /// When GET /api/v1/contactos?clienteId=%20 is called,
    /// Then the response is NOT HTTP 500 (no unhandled exception).
    /// (400 or 200 are both acceptable — 500 is never acceptable.)
    /// </summary>
    [Fact]
    public async Task EC5_GetContactosByClienteId_DoesNotReturn500_WhenClienteIdIsWhitespace()
    {
        // GIVEN: clienteId param is a single space character
        var factory = new ContactosByClienteIdWebApplicationFactory();
        var client = factory.CreateClient();

        // WHEN: GET /api/v1/contactos?clienteId=%20
        var response = await client.GetAsync("/api/v1/contactos?clienteId=%20");

        // THEN: NOT HTTP 500
        Assert.NotEqual(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    // -------------------------------------------------------------------------
    // EC-6: Uppercase UUID is accepted (case-insensitive UUID parsing)
    // -------------------------------------------------------------------------

    /// <summary>
    /// EC-6 — Given a valid clienteId with uppercase hex characters,
    /// When GET /api/v1/contactos?clienteId={UPPERCASE_UUID} is called,
    /// Then HTTP 200 is returned (Guid.TryParse is case-insensitive in .NET).
    /// </summary>
    [Fact]
    public async Task EC6_GetContactosByClienteId_Returns200_WhenClienteIdIsUppercaseUuid()
    {
        // GIVEN: A contact linked to a client
        var factory = new ContactosByClienteIdWebApplicationFactory();
        var client = factory.CreateClient();

        var clienteId = Guid.NewGuid();

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var contacto = ContactoEntity.Create(
            nombre: "Uppercase UUID Test",
            cargo: "QA",
            telefono: "3009990001",
            email: "upper@siesa.com",
            clienteId: clienteId,
            createdAt: DateTimeOffset.UtcNow,
            updatedAt: DateTimeOffset.UtcNow
        );
        await dbContext.Set<ContactoEntity>().AddAsync(contacto);
        await dbContext.SaveChangesAsync();

        // WHEN: GET /api/v1/contactos?clienteId={UPPERCASE_UUID}
        var upperCaseId = clienteId.ToString().ToUpperInvariant();
        var response = await client.GetAsync($"/api/v1/contactos?clienteId={upperCaseId}");

        // THEN: HTTP 200 (case-insensitive UUID parsing)
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // -------------------------------------------------------------------------
    // EC-7: createdAt in response is a DateTimeOffset (has timezone suffix)
    // -------------------------------------------------------------------------

    /// <summary>
    /// EC-7 — Given a contact linked to clienteA,
    /// When GET /api/v1/contactos?clienteId={clienteAId} is called,
    /// Then each DTO's createdAt value includes timezone information (Z or ±HH:mm).
    /// Architecture requirement: DateTimeOffset mandatory, never DateTime.
    /// </summary>
    [Fact]
    public async Task EC7_GetContactosByClienteId_CreatedAt_HasTimezoneInfo()
    {
        // GIVEN: A contact with explicit DateTimeOffset.UtcNow timestamp
        var factory = new ContactosByClienteIdWebApplicationFactory();
        var client = factory.CreateClient();

        var clienteId = Guid.NewGuid();

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var contacto = ContactoEntity.Create(
            nombre: "Timezone Test",
            cargo: "Tester",
            telefono: "3001111001",
            email: "tz@siesa.com",
            clienteId: clienteId,
            createdAt: new DateTimeOffset(2026, 6, 29, 10, 30, 0, TimeSpan.Zero),
            updatedAt: DateTimeOffset.UtcNow
        );
        await dbContext.Set<ContactoEntity>().AddAsync(contacto);
        await dbContext.SaveChangesAsync();

        // WHEN: GET /api/v1/contactos?clienteId={clienteId}
        var response = await client.GetAsync($"/api/v1/contactos?clienteId={clienteId}");

        // THEN: HTTP 200
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.True(doc.RootElement.GetArrayLength() >= 1);

        var item = doc.RootElement.EnumerateArray().First();
        Assert.True(item.TryGetProperty("createdAt", out var createdAtProp), "Missing createdAt field");
        var createdAtStr = createdAtProp.GetString();
        Assert.False(string.IsNullOrEmpty(createdAtStr));

        // THEN: createdAt includes timezone suffix (Z or offset like +00:00 or -05:00)
        var hasTimezone = createdAtStr!.EndsWith('Z')
            || createdAtStr.Contains('+')
            || (createdAtStr.LastIndexOf('-') > 10); // offset minus after the date portion

        Assert.True(hasTimezone, $"createdAt '{createdAtStr}' must include timezone info (DateTimeOffset requirement)");

        // THEN: Value is parseable as DateTimeOffset
        Assert.True(DateTimeOffset.TryParse(createdAtStr, out _),
            $"createdAt '{createdAtStr}' is not a valid DateTimeOffset");
    }

    // -------------------------------------------------------------------------
    // EC-8: Concurrent requests for same clienteId both return correct results
    // -------------------------------------------------------------------------

    /// <summary>
    /// EC-8 — Given 3 contacts exist for clienteA,
    /// When two concurrent GET /api/v1/contactos?clienteId={clienteAId} calls are made,
    /// Then both responses return HTTP 200 with the same 3 contacts.
    /// </summary>
    [Fact]
    public async Task EC8_GetContactosByClienteId_ConcurrentRequests_BothReturnCorrectResults()
    {
        // GIVEN: 3 contacts for clienteA
        var factory = new ContactosByClienteIdWebApplicationFactory();

        var clienteAId = Guid.NewGuid();

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var contacts = Enumerable.Range(1, 3).Select(i => ContactoEntity.Create(
            nombre: $"Concurrente {i}",
            cargo: $"Cargo {i}",
            telefono: $"30010000{i:D2}",
            email: $"concurrent{i}@siesa.com",
            clienteId: clienteAId,
            createdAt: DateTimeOffset.UtcNow.AddSeconds(-i),
            updatedAt: DateTimeOffset.UtcNow
        )).ToList();

        await dbContext.Set<ContactoEntity>().AddRangeAsync(contacts);
        await dbContext.SaveChangesAsync();

        // WHEN: Two concurrent requests for the same clienteId
        var client1 = factory.CreateClient();
        var client2 = factory.CreateClient();

        var url = $"/api/v1/contactos?clienteId={clienteAId}";
        var task1 = client1.GetAsync(url);
        var task2 = client2.GetAsync(url);

        var results = await Task.WhenAll(task1, task2);

        // THEN: Both responses return HTTP 200
        Assert.Equal(HttpStatusCode.OK, results[0].StatusCode);
        Assert.Equal(HttpStatusCode.OK, results[1].StatusCode);

        // THEN: Both return 3 contacts
        var json1 = await results[0].Content.ReadAsStringAsync();
        var json2 = await results[1].Content.ReadAsStringAsync();

        using var doc1 = JsonDocument.Parse(json1);
        using var doc2 = JsonDocument.Parse(json2);

        Assert.Equal(3, doc1.RootElement.GetArrayLength());
        Assert.Equal(3, doc2.RootElement.GetArrayLength());
    }
}
