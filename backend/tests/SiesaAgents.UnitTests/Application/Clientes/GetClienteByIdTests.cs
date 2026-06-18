using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Application.Clientes;

public class GetClienteByIdTests
{
    [Fact]
    public async Task GetClienteById_HappyPath_Returns200WithCorrectClienteDto()
    {
        // Arrange
        await using var factory = new ClientesTestFactory();
        Guid clienteId;

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var entity = ClienteEntity.Create("Empresa Alpha", "900100001", "3001000001", "Bogotá");
            clienteId = entity.Id;
            db.Clientes.Add(entity);
            await db.SaveChangesAsync();
        }

        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync($"/api/v1/clientes/{clienteId}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.Equal(JsonValueKind.Object, root.ValueKind);
        Assert.True(root.TryGetProperty("id", out var idProp), "Missing 'id'");
        Assert.True(root.TryGetProperty("nombre", out var nombreProp), "Missing 'nombre'");
        Assert.True(root.TryGetProperty("nit", out var nitProp), "Missing 'nit'");
        Assert.True(root.TryGetProperty("telefono", out var telefonoProp), "Missing 'telefono'");
        Assert.True(root.TryGetProperty("ciudad", out var ciudadProp), "Missing 'ciudad'");
        Assert.True(root.TryGetProperty("createdAt", out _), "Missing 'createdAt'");

        Assert.Equal(clienteId.ToString(), idProp.GetString());
        Assert.Equal("Empresa Alpha", nombreProp.GetString());
        Assert.Equal("900100001", nitProp.GetString());
        Assert.Equal("3001000001", telefonoProp.GetString());
        Assert.Equal("Bogotá", ciudadProp.GetString());
    }

    [Fact]
    public async Task GetClienteById_NotFound_Returns404ProblemDetails()
    {
        // Arrange
        await using var factory = new ClientesTestFactory();
        var nonExistentId = Guid.NewGuid();
        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync($"/api/v1/clientes/{nonExistentId}");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("status", out var statusProp), "Missing 'status'");
        Assert.True(root.TryGetProperty("title", out _), "Missing 'title'");
        Assert.True(root.TryGetProperty("detail", out var detailProp), "Missing 'detail'");

        Assert.Equal(404, statusProp.GetInt32());
        Assert.Equal("Cliente no encontrado.", detailProp.GetString());

        // NFR6: No stackTrace key in 404 response
        Assert.False(root.TryGetProperty("stackTrace", out _), "Response must not contain 'stackTrace'");
    }

    [Fact]
    public async Task GetClienteById_ResponseShape_ContainsAllRequiredFields()
    {
        // Arrange
        await using var factory = new ClientesTestFactory();
        Guid clienteId;

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var entity = ClienteEntity.Create("Shape Test SA", "800000099", "3002000001", "Cali");
            clienteId = entity.Id;
            db.Clientes.Add(entity);
            await db.SaveChangesAsync();
        }

        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync($"/api/v1/clientes/{clienteId}");
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        // Assert: all required fields present
        Assert.True(root.TryGetProperty("id", out _), "Missing 'id'");
        Assert.True(root.TryGetProperty("nombre", out _), "Missing 'nombre'");
        Assert.True(root.TryGetProperty("nit", out _), "Missing 'nit'");
        Assert.True(root.TryGetProperty("telefono", out _), "Missing 'telefono'");
        Assert.True(root.TryGetProperty("ciudad", out _), "Missing 'ciudad'");
        Assert.True(root.TryGetProperty("createdAt", out _), "Missing 'createdAt'");
    }
}
