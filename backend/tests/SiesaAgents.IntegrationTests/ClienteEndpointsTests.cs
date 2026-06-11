using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Infrastructure.Data;
using Xunit;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// Integration tests for GET /api/v1/clientes endpoint.
/// Uses WebApplicationFactory with InMemory database to avoid PostgreSQL dependency.
/// </summary>
public class ClienteEndpointsTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ClienteEndpointsTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Replace PostgreSQL with InMemory for tests
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                if (descriptor != null) services.Remove(descriptor);

                services.AddDbContext<AppDbContext>(options =>
                    options.UseInMemoryDatabase("IntegrationTestDb_" + Guid.NewGuid()));
            });
        });
    }

    private HttpClient CreateClientWithSeedData(params ClienteEntity[] entities)
    {
        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                if (descriptor != null) services.Remove(descriptor);

                var dbName = "IntegrationTestDb_" + Guid.NewGuid();
                services.AddDbContext<AppDbContext>(options =>
                    options.UseInMemoryDatabase(dbName));

                var sp = services.BuildServiceProvider();
                using var scope = sp.CreateScope();
                var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                ctx.Database.EnsureCreated();
                ctx.Clientes.AddRange(entities);
                ctx.SaveChanges();
            });
        }).CreateClient();

        return client;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-P1-01: GET /api/v1/clientes returns 200 with array
    //
    // Given: the system has at least one cliente
    // When:  GET /api/v1/clientes is called
    // Then:  200 OK is returned with a JSON array
    //   And: each element has all fields including createdAt as ISO 8601 UTC offset
    // ─────────────────────────────────────────────────────────────────────────
    [Fact]
    public async Task GetClientes_ReturnsOkWithArray()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa Alpha", "900123456-1", "6014567890", "Bogotá");
        var client = CreateClientWithSeedData(entity);

        // Act
        var response = await client.GetAsync("/api/v1/clientes");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var dtos = await response.Content.ReadFromJsonAsync<List<ClienteDto>>();
        Assert.NotNull(dtos);
        Assert.Single(dtos);

        var dto = dtos[0];
        Assert.Equal(entity.Nombre, dto.Nombre);
        Assert.Equal(entity.Nit, dto.Nit);
        Assert.Equal(entity.Telefono, dto.Telefono);
        Assert.Equal(entity.Ciudad, dto.Ciudad);
        // CreatedAt must be DateTimeOffset (ISO 8601 with UTC offset)
        Assert.NotEqual(default, dto.CreatedAt);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-P2-07: GET /api/v1/clientes?q=Alpha filters by name
    //
    // Given: the system has multiple clientes
    // When:  GET /api/v1/clientes?q=Alpha is called
    // Then:  only clientes matching "Alpha" in name are returned
    // ─────────────────────────────────────────────────────────────────────────
    [Fact]
    public async Task GetClientes_WithSearchByName_FiltersResults()
    {
        // Arrange
        var alpha = ClienteEntity.Create("Empresa Alpha", "900111111-1", "601111111", "Bogotá");
        var beta = ClienteEntity.Create("Empresa Beta", "900222222-2", "602222222", "Medellín");
        var client = CreateClientWithSeedData(alpha, beta);

        // Act
        var response = await client.GetAsync("/api/v1/clientes?q=Alpha");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dtos = await response.Content.ReadFromJsonAsync<List<ClienteDto>>();
        Assert.NotNull(dtos);
        Assert.Single(dtos);
        Assert.Equal("Empresa Alpha", dtos[0].Nombre);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-P2-07: GET /api/v1/clientes?q=111 filters by NIT
    //
    // Given: the system has multiple clientes
    // When:  GET /api/v1/clientes?q=111 is called
    // Then:  only clientes matching "111" in NIT are returned
    // ─────────────────────────────────────────────────────────────────────────
    [Fact]
    public async Task GetClientes_WithSearchByNit_FiltersResults()
    {
        // Arrange
        var alpha = ClienteEntity.Create("Empresa Alpha", "900111111-1", "601111111", "Bogotá");
        var beta = ClienteEntity.Create("Empresa Beta", "900222222-2", "602222222", "Medellín");
        var client = CreateClientWithSeedData(alpha, beta);

        // Act
        var response = await client.GetAsync("/api/v1/clientes?q=111");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dtos = await response.Content.ReadFromJsonAsync<List<ClienteDto>>();
        Assert.NotNull(dtos);
        Assert.Single(dtos);
        Assert.Equal("900111111-1", dtos[0].Nit);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Given: the system has no clientes
    // When:  GET /api/v1/clientes is called
    // Then:  200 OK with empty array is returned
    // ─────────────────────────────────────────────────────────────────────────
    [Fact]
    public async Task GetClientes_WhenEmpty_ReturnsOkWithEmptyArray()
    {
        // Arrange
        var client = CreateClientWithSeedData();

        // Act
        var response = await client.GetAsync("/api/v1/clientes");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dtos = await response.Content.ReadFromJsonAsync<List<ClienteDto>>();
        Assert.NotNull(dtos);
        Assert.Empty(dtos);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EXPANDED COVERAGE — Edge cases NOT in ATDD tests
    // Generated by TEA testarch-automate (BMad-Integrated mode)
    // ─────────────────────────────────────────────────────────────────────────

    // [P1] Response content-type is application/json
    //
    // Given: the system has clientes
    // When:  GET /api/v1/clientes is called
    // Then:  response Content-Type is application/json
    [Fact]
    public async Task GetClientes_ResponseContentType_IsApplicationJson()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa JSON Test", "900700700-7", "6017007007", "Bogotá");
        var client = CreateClientWithSeedData(entity);

        // Act
        var response = await client.GetAsync("/api/v1/clientes");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(response.Content.Headers.ContentType);
        Assert.Contains("application/json", response.Content.Headers.ContentType!.MediaType);
    }

    // [P1] Response is a direct JSON array (not wrapped in an object)
    //
    // Given: the system has at least one cliente
    // When:  GET /api/v1/clientes is called
    // Then:  the response body begins with '[' (a JSON array, not '{"data":...}')
    [Fact]
    public async Task GetClientes_ResponseBody_IsDirectJsonArray()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa Array Test", "900800800-8", "6018008008", "Medellín");
        var client = CreateClientWithSeedData(entity);

        // Act
        var response = await client.GetAsync("/api/v1/clientes");
        var body = await response.Content.ReadAsStringAsync();

        // Assert — direct array, not wrapped object
        Assert.StartsWith("[", body.TrimStart());
    }

    // [P2] GET /api/v1/clientes?q= (empty string) returns all clientes
    //
    // Given: the system has multiple clientes
    // When:  GET /api/v1/clientes?q= is called (empty q)
    // Then:  all clientes are returned
    [Fact]
    public async Task GetClientes_WithEmptyQParam_ReturnsAllClientes()
    {
        // Arrange
        var alpha = ClienteEntity.Create("Empresa Alpha", "900100100-1", "601100100", "Bogotá");
        var beta = ClienteEntity.Create("Empresa Beta", "900200200-2", "601200200", "Cali");
        var client = CreateClientWithSeedData(alpha, beta);

        // Act
        var response = await client.GetAsync("/api/v1/clientes?q=");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dtos = await response.Content.ReadFromJsonAsync<List<ClienteDto>>();
        Assert.NotNull(dtos);
        Assert.Equal(2, dtos!.Count);
    }

    // [P2] Search query that matches nothing returns empty array (not 404)
    //
    // Given: the system has clientes
    // When:  GET /api/v1/clientes?q=ZZZNOMATCH is called
    // Then:  200 OK with empty array (not 404 Not Found)
    [Fact]
    public async Task GetClientes_WithSearchMatchingNothing_ReturnsOkWithEmptyArray()
    {
        // Arrange
        var alpha = ClienteEntity.Create("Empresa Alpha", "900300300-3", "601300300", "Bogotá");
        var client = CreateClientWithSeedData(alpha);

        // Act
        var response = await client.GetAsync("/api/v1/clientes?q=ZZZNOMATCH");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dtos = await response.Content.ReadFromJsonAsync<List<ClienteDto>>();
        Assert.NotNull(dtos);
        Assert.Empty(dtos);
    }

    // [P2] CreatedAt field in response is in ISO 8601 UTC offset format
    //
    // Given: a cliente entity created with DateTimeOffset.UtcNow
    // When:  GET /api/v1/clientes is called
    // Then:  createdAt field in JSON response is a valid ISO 8601 datetime string
    [Fact]
    public async Task GetClientes_CreatedAt_IsIso8601UtcOffset()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa ISO Date", "900400400-4", "601400400", "Barranquilla");
        var client = CreateClientWithSeedData(entity);

        // Act
        var response = await client.GetAsync("/api/v1/clientes");
        var dtos = await response.Content.ReadFromJsonAsync<List<ClienteDto>>();

        // Assert
        Assert.NotNull(dtos);
        Assert.Single(dtos);
        var dto = dtos![0];
        // DateTimeOffset.UtcNow-based values should not be the default
        Assert.NotEqual(default(DateTimeOffset), dto.CreatedAt);
        Assert.NotEqual(default(DateTimeOffset), dto.UpdatedAt);
        // UTC offset should be zero (DateTimeOffset.UtcNow)
        Assert.Equal(TimeSpan.Zero, dto.CreatedAt.Offset);
    }

    // [P2] Multiple clientes returned with all fields distinct
    //
    // Given: two clientes with different data exist
    // When:  GET /api/v1/clientes is called
    // Then:  both are returned with their distinct field values
    [Fact]
    public async Task GetClientes_MultipleEntities_AllReturnedWithCorrectData()
    {
        // Arrange
        var alpha = ClienteEntity.Create("Empresa Alpha", "900500500-5", "601500500", "Bogotá");
        var beta = ClienteEntity.Create("Empresa Beta", "900600600-6", "601600600", "Medellín");
        var client = CreateClientWithSeedData(alpha, beta);

        // Act
        var response = await client.GetAsync("/api/v1/clientes");
        var dtos = await response.Content.ReadFromJsonAsync<List<ClienteDto>>();

        // Assert
        Assert.NotNull(dtos);
        Assert.Equal(2, dtos!.Count);

        var alphaDto = dtos.Single(d => d.Nombre == "Empresa Alpha");
        var betaDto = dtos.Single(d => d.Nombre == "Empresa Beta");

        Assert.Equal("900500500-5", alphaDto.Nit);
        Assert.Equal("Bogotá", alphaDto.Ciudad);
        Assert.Equal("900600600-6", betaDto.Nit);
        Assert.Equal("Medellín", betaDto.Ciudad);
    }
}
