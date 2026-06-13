using Microsoft.EntityFrameworkCore;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Infrastructure.Data;
using SiesaAgents.Infrastructure.Repositories;

namespace SiesaAgents.UnitTests.Application.Clientes;

public class GetClientesQueryHandlerTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly GetClientesQueryHandler _handler;

    public GetClientesQueryHandlerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new AppDbContext(options);
        var repository = new ClienteRepository(_context);
        _handler = new GetClientesQueryHandler(repository);
    }

    [Fact]
    public async Task HandleAsync_EmptyRepository_ReturnsEmptyList()
    {
        // Arrange
        var query = new GetClientesQuery();

        // Act
        var result = await _handler.HandleAsync(query, CancellationToken.None);

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public async Task HandleAsync_PopulatedRepository_ReturnsAllClientsAsDtos()
    {
        // Arrange
        var cliente1 = ClienteEntity.Create("Empresa Alfa SA", "900100200", "3001000001", "Bogotá");
        var cliente2 = ClienteEntity.Create("Comercial Beta SAS", "900200300", "3001000002", "Medellín");
        _context.Clientes.AddRange(cliente1, cliente2);
        await _context.SaveChangesAsync();

        var query = new GetClientesQuery();

        // Act
        var result = (await _handler.HandleAsync(query, CancellationToken.None)).ToList();

        // Assert
        Assert.Equal(2, result.Count);
        Assert.Contains(result, dto => dto.Nombre == "Empresa Alfa SA" && dto.Nit == "900100200");
        Assert.Contains(result, dto => dto.Nombre == "Comercial Beta SAS" && dto.Nit == "900200300");
    }

    [Fact]
    public async Task HandleAsync_PopulatedRepository_ReturnsDtosWithCorrectFields()
    {
        // Arrange
        var cliente = ClienteEntity.Create("Test Cliente", "123456789", "3000000000", "Cali");
        _context.Clientes.Add(cliente);
        await _context.SaveChangesAsync();

        var query = new GetClientesQuery();

        // Act
        var result = (await _handler.HandleAsync(query, CancellationToken.None)).ToList();

        // Assert
        Assert.Single(result);
        var dto = result.First();
        Assert.Equal(cliente.Id, dto.Id);
        Assert.Equal("Test Cliente", dto.Nombre);
        Assert.Equal("123456789", dto.Nit);
        Assert.Equal("3000000000", dto.Telefono);
        Assert.Equal("Cali", dto.Ciudad);
        Assert.NotEqual(default, dto.CreatedAt);
        Assert.NotEqual(default, dto.UpdatedAt);
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}
