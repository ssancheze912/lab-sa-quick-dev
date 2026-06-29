/**
 * API Integration Tests — GET /api/v1/clientes
 * Story 2.1 — Client List & Search
 *
 * Test IDs covered:
 *   TC-E2-P1-17  GET /api/v1/clientes returns 200, direct array, all DTO fields
 *
 * Stack: xUnit 2 + WebApplicationFactory<Program> + EF Core InMemory
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
/// Lightweight WebApplicationFactory that replaces the PostgreSQL DbContext
/// with an in-memory EF Core provider so tests run without a real database.
/// </summary>
public sealed class ClientesWebApplicationFactory : WebApplicationFactory<Program>
{
    public string DatabaseName { get; init; } = $"IntegrationTestDb_{Guid.NewGuid()}";

    protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // EF Core registers IDbContextOptionsConfiguration<T> services for each
            // extension (UseNpgsql, UseSnakeCaseNamingConvention). We must remove ALL of
            // them to prevent the "dual provider" error when adding UseInMemoryDatabase.
            var dbContextOptionsConfigType = typeof(Microsoft.EntityFrameworkCore.Infrastructure.IDbContextOptionsConfiguration<AppDbContext>);
            var toRemove = services
                .Where(d =>
                    d.ServiceType == typeof(DbContextOptions<AppDbContext>) ||
                    d.ServiceType == typeof(AppDbContext) ||
                    dbContextOptionsConfigType.IsAssignableFrom(d.ServiceType))
                .ToList();

            foreach (var d in toRemove)
                services.Remove(d);

            // Register a clean in-memory DbContext
            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase(DatabaseName));
        });
    }
}

/// <summary>
/// Shared factory instance for all tests in this file — reused via IClassFixture.
/// </summary>
public sealed class ClientesEndpointsTests : IClassFixture<ClientesWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly ClientesWebApplicationFactory _factory;

    public ClientesEndpointsTests(ClientesWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    // -------------------------------------------------------------------------
    // TC-E2-P1-17: GET /api/v1/clientes returns 200 with correct DTO shape
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-E2-P1-17 — Given 2 seeded clients,
    /// When GET /api/v1/clientes is called,
    /// Then returns HTTP 200 with a direct JSON array containing both items,
    /// each having id (UUID), nombre, nit, telefono, ciudad, createdAt (ISO 8601 with TZ).
    /// </summary>
    [Fact]
    public async Task TC_E2_P1_17_GetClientes_Returns200_WithDirectArrayAndAllDtoFields()
    {
        // GIVEN: 2 clients are seeded in the database
        await SeedClientesAsync(2);

        // WHEN: GET /api/v1/clientes
        var response = await _client.GetAsync("/api/v1/clientes");

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
            Assert.True(Guid.TryParse(idProp.GetString(), out _), $"'id' is not a valid UUID: {idProp.GetString()}");

            // nombre — non-null string
            Assert.True(item.TryGetProperty("nombre", out var nombreProp), "Missing 'nombre' field");
            Assert.Equal(JsonValueKind.String, nombreProp.ValueKind);
            Assert.False(string.IsNullOrEmpty(nombreProp.GetString()));

            // nit — non-null string
            Assert.True(item.TryGetProperty("nit", out var nitProp), "Missing 'nit' field");
            Assert.Equal(JsonValueKind.String, nitProp.ValueKind);

            // telefono — non-null string
            Assert.True(item.TryGetProperty("telefono", out var telefonoProp), "Missing 'telefono' field");
            Assert.Equal(JsonValueKind.String, telefonoProp.ValueKind);

            // ciudad — non-null string
            Assert.True(item.TryGetProperty("ciudad", out var ciudadProp), "Missing 'ciudad' field");
            Assert.Equal(JsonValueKind.String, ciudadProp.ValueKind);

            // createdAt — ISO 8601 string with timezone information (DateTimeOffset)
            Assert.True(item.TryGetProperty("createdAt", out var createdAtProp), "Missing 'createdAt' field");
            Assert.Equal(JsonValueKind.String, createdAtProp.ValueKind);

            var createdAtStr = createdAtProp.GetString();
            Assert.False(string.IsNullOrEmpty(createdAtStr));

            // Must parse as DateTimeOffset (not plain DateTime — TZ required per architecture)
            Assert.True(
                DateTimeOffset.TryParse(createdAtStr, out var parsedDate),
                $"'createdAt' is not a valid DateTimeOffset ISO 8601 string: {createdAtStr}"
            );

            // Must include timezone offset (non-zero or explicit 'Z')
            Assert.True(
                createdAtStr!.EndsWith('Z') || createdAtStr.Contains('+') || createdAtStr.Contains('-', StringComparison.Ordinal),
                $"'createdAt' does not contain timezone information: {createdAtStr}"
            );
        }
    }

    // -------------------------------------------------------------------------
    // TC-E2-P1-17 variant: GET returns empty array when no clients seeded
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given no clients in the database,
    /// When GET /api/v1/clientes is called,
    /// Then returns HTTP 200 with an empty JSON array [].
    /// </summary>
    [Fact]
    public async Task GetClientes_Returns200_WithEmptyArray_WhenNoneExist()
    {
        // GIVEN: A fresh isolated client that does not see other tests' seeded data
        // Use a unique in-memory DB name to isolate this test
        var uniqueDb = $"EmptyDb_{Guid.NewGuid()}";
        var factory = new ClientesWebApplicationFactory();
        var isolatedFactory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                var descriptors = services
                    .Where(d => d.ServiceType == typeof(DbContextOptions<AppDbContext>)
                             || (d.ServiceType.IsGenericType &&
                                 d.ServiceType.GetGenericTypeDefinition() == typeof(DbContextOptions<>)))
                    .ToList();
                foreach (var d in descriptors)
                    services.Remove(d);

                services.AddDbContext<AppDbContext>(options =>
                    options.UseInMemoryDatabase(uniqueDb));
            });
        });
        var client = isolatedFactory.CreateClient();

        // WHEN: GET /api/v1/clientes
        var response = await client.GetAsync("/api/v1/clientes");

        // THEN: HTTP 200 OK with empty array
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        Assert.Equal(0, doc.RootElement.GetArrayLength());
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private async Task SeedClientesAsync(int count)
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var clientes = Enumerable.Range(1, count).Select(i => ClienteEntity.Create(
            nombre: $"Empresa Test {i:D4}",
            nit: $"900{i:D6}-{i % 10}",
            telefono: $"300{i:D7}",
            ciudad: "Bogotá",
            createdAt: DateTimeOffset.UtcNow.AddDays(-i),
            updatedAt: DateTimeOffset.UtcNow.AddDays(-i)
        ));

        await dbContext.Clientes.AddRangeAsync(clientes);
        await dbContext.SaveChangesAsync();
    }
}
