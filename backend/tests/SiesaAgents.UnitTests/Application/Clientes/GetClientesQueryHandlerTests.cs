using Microsoft.EntityFrameworkCore;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Entities;
using SiesaAgents.Infrastructure.Data;
using SiesaAgents.Infrastructure.Repositories;
using Xunit;

namespace SiesaAgents.UnitTests.Application.Clientes;

public class GetClientesQueryHandlerTests
{
    private static AppDbContext CreateInMemoryContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task HandleAsync_ReturnsEmptyList_WhenNoClientsInDb()
    {
        // Arrange
        await using var context = CreateInMemoryContext(nameof(HandleAsync_ReturnsEmptyList_WhenNoClientsInDb));
        var repository = new ClienteRepository(context);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery());

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public async Task HandleAsync_ReturnsMappedClienteDtoList_WhenClientsExist()
    {
        // Arrange
        await using var context = CreateInMemoryContext(nameof(HandleAsync_ReturnsMappedClienteDtoList_WhenClientsExist));
        var cliente = ClienteEntity.Create("Empresa Alpha", "900123456-1", "3001234567", "Bogotá");
        context.Clientes.Add(cliente);
        await context.SaveChangesAsync();

        var repository = new ClienteRepository(context);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = (await handler.HandleAsync(new GetClientesQuery())).ToList();

        // Assert
        Assert.Single(result);
        Assert.Equal("Empresa Alpha", result[0].Nombre);
        Assert.Equal("900123456-1", result[0].Nit);
        Assert.Equal("3001234567", result[0].Telefono);
        Assert.Equal("Bogotá", result[0].Ciudad);
    }

    [Fact]
    public async Task HandleAsync_UsesNoTracking_WhenReturningClients()
    {
        // Arrange
        await using var context = CreateInMemoryContext(nameof(HandleAsync_UsesNoTracking_WhenReturningClients));
        var cliente = ClienteEntity.Create("Empresa Beta", "800987654-2", "3119876543", "Medellín");
        context.Clientes.Add(cliente);
        await context.SaveChangesAsync();
        context.ChangeTracker.Clear();

        var repository = new ClienteRepository(context);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        await handler.HandleAsync(new GetClientesQuery());

        // Assert — AsNoTracking means ChangeTracker has no tracked entries
        Assert.Empty(context.ChangeTracker.Entries());
    }
}
