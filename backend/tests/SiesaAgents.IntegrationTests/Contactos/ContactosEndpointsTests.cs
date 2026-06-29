/**
 * API Integration Tests — GET /api/v1/contactos
 * Story 3.1 — Contact List & Search
 *
 * Test IDs covered (RED phase — endpoint does not exist yet):
 *   TC-E3-P1-04  GET /api/v1/contactos returns 200, direct array, all DTO fields with correct types
 *
 * Stack: xUnit 2 + WebApplicationFactory<Program> + EF Core InMemory
 *
 * Expected RED failure:
 *   - 404 Not Found because GET /api/v1/contactos is not yet registered in Program.cs
 *   - OR: ContactoEntity does not exist yet in the domain layer
 *
 * Given-When-Then format per test method.
 */

using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests.Contactos;

/// <summary>
/// Lightweight WebApplicationFactory that replaces the PostgreSQL DbContext
/// with an in-memory EF Core provider so tests run without a real database.
/// </summary>
public sealed class ContactosWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remove the existing AppDbContext registration (PostgreSQL)
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
            if (descriptor is not null)
                services.Remove(descriptor);

            // Replace with in-memory database
            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase($"IntegrationTestDb_Contactos_{Guid.NewGuid()}"));
        });
    }
}

/// <summary>
/// Shared factory instance for all tests in this file — reused via IClassFixture.
/// </summary>
public sealed class ContactosEndpointsTests : IClassFixture<ContactosWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly ContactosWebApplicationFactory _factory;

    public ContactosEndpointsTests(ContactosWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    // -------------------------------------------------------------------------
    // TC-E3-P1-04: GET /api/v1/contactos returns 200 with correct DTO shape
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-E3-P1-04 — Given 2 seeded contacts,
    /// When GET /api/v1/contactos is called,
    /// Then returns HTTP 200 with a direct JSON array containing both items,
    /// each having id (UUID), nombre, cargo, telefono, email, clienteId (null or UUID),
    /// createdAt (ISO 8601 with TZ).
    ///
    /// Acceptance criteria: AC#1 (FR10, AC-E3.1)
    /// </summary>
    [Fact]
    public async Task TC_E3_P1_04_GetContactos_Returns200_WithDirectArrayAndAllDtoFields()
    {
        // GIVEN: 2 contacts are seeded in the database
        await SeedContactosAsync(2);

        // WHEN: GET /api/v1/contactos
        var response = await _client.GetAsync("/api/v1/contactos");

        // THEN: HTTP 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // THEN: Response is a direct JSON array (not wrapped object)
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);

        // THEN: Array has at least 2 items
        Assert.True(doc.RootElement.GetArrayLength() >= 2);

        // THEN: Each item has the expected DTO fields with correct types
        foreach (var item in doc.RootElement.EnumerateArray())
        {
            // id — must be a valid UUID (Guid)
            Assert.True(item.TryGetProperty("id", out var idProp), "Missing 'id' field");
            Assert.True(
                Guid.TryParse(idProp.GetString(), out _),
                $"'id' is not a valid UUID: {idProp.GetString()}"
            );

            // nombre — non-null, non-empty string
            Assert.True(item.TryGetProperty("nombre", out var nombreProp), "Missing 'nombre' field");
            Assert.Equal(JsonValueKind.String, nombreProp.ValueKind);
            Assert.False(string.IsNullOrEmpty(nombreProp.GetString()));

            // cargo — non-null string
            Assert.True(item.TryGetProperty("cargo", out var cargoProp), "Missing 'cargo' field");
            Assert.Equal(JsonValueKind.String, cargoProp.ValueKind);

            // telefono — non-null string
            Assert.True(item.TryGetProperty("telefono", out var telefonoProp), "Missing 'telefono' field");
            Assert.Equal(JsonValueKind.String, telefonoProp.ValueKind);

            // email — non-null, non-empty string
            Assert.True(item.TryGetProperty("email", out var emailProp), "Missing 'email' field");
            Assert.Equal(JsonValueKind.String, emailProp.ValueKind);
            Assert.False(string.IsNullOrEmpty(emailProp.GetString()));

            // clienteId — must be null or a valid UUID (nullable FK)
            Assert.True(item.TryGetProperty("clienteId", out var clienteIdProp), "Missing 'clienteId' field");
            Assert.True(
                clienteIdProp.ValueKind == JsonValueKind.Null ||
                (clienteIdProp.ValueKind == JsonValueKind.String &&
                 Guid.TryParse(clienteIdProp.GetString(), out _)),
                $"'clienteId' must be null or a valid UUID, got: {clienteIdProp}"
            );

            // createdAt — ISO 8601 string with timezone information (DateTimeOffset)
            Assert.True(item.TryGetProperty("createdAt", out var createdAtProp), "Missing 'createdAt' field");
            Assert.Equal(JsonValueKind.String, createdAtProp.ValueKind);

            var createdAtStr = createdAtProp.GetString();
            Assert.False(string.IsNullOrEmpty(createdAtStr));

            // Must parse as DateTimeOffset (not plain DateTime — TZ required per architecture)
            Assert.True(
                DateTimeOffset.TryParse(createdAtStr, out _),
                $"'createdAt' is not a valid DateTimeOffset ISO 8601 string: {createdAtStr}"
            );

            // Must include timezone offset (non-zero or explicit 'Z') — DateTimeOffset requirement
            Assert.True(
                createdAtStr!.EndsWith('Z') ||
                createdAtStr.Contains('+') ||
                createdAtStr.Contains('-', StringComparison.Ordinal),
                $"'createdAt' does not contain timezone information: {createdAtStr}"
            );
        }
    }

    // -------------------------------------------------------------------------
    // Empty array variant: GET returns [] when no contacts seeded
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given no contacts in the database,
    /// When GET /api/v1/contactos is called,
    /// Then returns HTTP 200 with an empty JSON array [].
    /// </summary>
    [Fact]
    public async Task GetContactos_Returns200_WithEmptyArray_WhenNoneExist()
    {
        // GIVEN: A fresh isolated client with an empty in-memory database
        using var factory = new ContactosWebApplicationFactory();
        var client = factory.CreateClient();

        // WHEN: GET /api/v1/contactos
        var response = await client.GetAsync("/api/v1/contactos");

        // THEN: HTTP 200 OK with empty array
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        Assert.Equal(0, doc.RootElement.GetArrayLength());
    }

    // -------------------------------------------------------------------------
    // Content-Type assertion: response must be application/json
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given contacts exist,
    /// When GET /api/v1/contactos is called,
    /// Then Content-Type is application/json (not text/plain or other).
    /// </summary>
    [Fact]
    public async Task GetContactos_Returns_ContentTypeApplicationJson()
    {
        // GIVEN: At least 1 contact in DB
        await SeedContactosAsync(1);

        // WHEN: GET /api/v1/contactos
        var response = await _client.GetAsync("/api/v1/contactos");

        // THEN: Content-Type includes application/json
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var contentType = response.Content.Headers.ContentType?.MediaType;
        Assert.Equal("application/json", contentType);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /// <summary>
    /// Seeds the in-memory database with a specified number of ContactoEntity records.
    /// NOTE: This uses ContactoEntity which does not exist yet (RED phase).
    /// When the entity is created in the domain layer, uncomment the seeding code below.
    /// </summary>
    private async Task SeedContactosAsync(int count)
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // NOTE: ContactoEntity does not exist yet — RED phase.
        // When implemented (Task 7 of Story 3.1), uncomment this block:
        //
        // var contactos = Enumerable.Range(1, count).Select(i => new SiesaAgents.Domain.Entities.ContactoEntity
        // {
        //     Id = Guid.NewGuid(),
        //     Nombre = $"Contacto Test {i:D4}",
        //     Cargo = $"Cargo Test {i:D4}",
        //     Telefono = $"310{i:D7}",
        //     Email = $"contacto.test.{i:D4}@siesa.com",
        //     ClienteId = null,
        //     CreatedAt = DateTimeOffset.UtcNow.AddDays(-i),
        //     UpdatedAt = DateTimeOffset.UtcNow.AddDays(-i),
        // }).ToList();
        // await dbContext.Set<SiesaAgents.Domain.Entities.ContactoEntity>().AddRangeAsync(contactos);
        // await dbContext.SaveChangesAsync();

        // Placeholder until domain entity exists — remove once entity is created
        await Task.CompletedTask;
    }
}
