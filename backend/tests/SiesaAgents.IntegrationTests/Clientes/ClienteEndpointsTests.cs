using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Infrastructure.Data;
using Xunit;

namespace SiesaAgents.IntegrationTests.Clientes;

public class ClienteEndpointsTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    private HttpClient CreateClient() =>
        factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(d =>
                    d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                if (descriptor is not null) services.Remove(descriptor);
                services.AddDbContext<AppDbContext>(opts =>
                    opts.UseInMemoryDatabase("IntegrationTestDb_" + Guid.NewGuid()));
            });
        }).CreateClient();

    [Fact]
    public async Task GetClienteById_ReturnsOk_WhenClienteExists()
    {
        // GIVEN a client exists in the system
        var client = CreateClient();
        var createResp = await client.PostAsJsonAsync("/api/v1/clientes", new
        {
            nombre = "Acme Corp",
            nit = "900123456-1",
            telefono = "3001234567",
            ciudad = "Bogotá"
        });
        createResp.EnsureSuccessStatusCode();
        var created = await createResp.Content.ReadFromJsonAsync<ClienteDto>();

        // WHEN the user requests the client by ID
        var resp = await client.GetAsync($"/api/v1/clientes/{created!.Id}");

        // THEN the response is 200 OK with the client details
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        var dto = await resp.Content.ReadFromJsonAsync<ClienteDto>();
        Assert.NotNull(dto);
        Assert.Equal("Acme Corp", dto!.Nombre);
        Assert.Equal("900123456-1", dto.Nit);
    }

    [Fact]
    public async Task GetClienteById_Returns404ProblemDetails_WhenClienteNotFound()
    {
        // GIVEN a client ID that does not exist
        var client = CreateClient();
        var nonExistentId = Guid.NewGuid();

        // WHEN the user requests the client by that ID
        var resp = await client.GetAsync($"/api/v1/clientes/{nonExistentId}");

        // THEN the response is 404 with Problem Details content type
        Assert.Equal(HttpStatusCode.NotFound, resp.StatusCode);
        Assert.Equal("application/problem+json", resp.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task GetClientes_ReturnsEmptyList_WhenNoClientesExist()
    {
        // GIVEN no clients in the system
        var client = CreateClient();

        // WHEN the user requests the client list
        var resp = await client.GetAsync("/api/v1/clientes");

        // THEN the response is 200 OK with an empty array
        resp.EnsureSuccessStatusCode();
        var list = await resp.Content.ReadFromJsonAsync<List<ClienteDto>>();
        Assert.NotNull(list);
        Assert.Empty(list!);
    }
}
