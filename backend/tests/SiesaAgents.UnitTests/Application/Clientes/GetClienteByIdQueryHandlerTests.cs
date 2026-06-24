using Microsoft.EntityFrameworkCore;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Entities;
using SiesaAgents.Domain.Exceptions;
using SiesaAgents.Infrastructure.Data;
using SiesaAgents.Infrastructure.Repositories;
using Xunit;

namespace SiesaAgents.UnitTests.Application.Clientes;

public class GetClienteByIdQueryHandlerTests
{
    private static AppDbContext CreateInMemoryContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task HandleAsync_ReturnsClienteDto_WhenClienteExists()
    {
        // Arrange
        await using var context = CreateInMemoryContext(nameof(HandleAsync_ReturnsClienteDto_WhenClienteExists));
        var cliente = ClienteEntity.Create("Empresa Alpha", "900123456-1", "3001234567", "Bogotá");
        context.Clientes.Add(cliente);
        await context.SaveChangesAsync();

        var repository = new ClienteRepository(context);
        var handler = new GetClienteByIdQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClienteByIdQuery(cliente.Id));

        // Assert
        Assert.Equal(cliente.Id, result.Id);
        Assert.Equal("Empresa Alpha", result.Nombre);
        Assert.Equal("900123456-1", result.Nit);
        Assert.Equal("3001234567", result.Telefono);
        Assert.Equal("Bogotá", result.Ciudad);
    }

    [Fact]
    public async Task HandleAsync_ThrowsNotFoundException_WhenClienteDoesNotExist()
    {
        // Arrange
        await using var context = CreateInMemoryContext(nameof(HandleAsync_ThrowsNotFoundException_WhenClienteDoesNotExist));
        var repository = new ClienteRepository(context);
        var handler = new GetClienteByIdQueryHandler(repository);
        var nonExistentId = Guid.NewGuid();

        // Act & Assert
        var exception = await Assert.ThrowsAsync<NotFoundException>(
            () => handler.HandleAsync(new GetClienteByIdQuery(nonExistentId)));

        Assert.Contains(nonExistentId.ToString(), exception.Message);
    }

    [Fact]
    public async Task HandleAsync_UsesNoTracking_WhenReturningCliente()
    {
        // Arrange
        await using var context = CreateInMemoryContext(nameof(HandleAsync_UsesNoTracking_WhenReturningCliente));
        var cliente = ClienteEntity.Create("Empresa Beta", "800987654-2", "3119876543", "Medellín");
        context.Clientes.Add(cliente);
        await context.SaveChangesAsync();
        context.ChangeTracker.Clear();

        var repository = new ClienteRepository(context);
        var handler = new GetClienteByIdQueryHandler(repository);

        // Act
        await handler.HandleAsync(new GetClienteByIdQuery(cliente.Id));

        // Assert — AsNoTracking means ChangeTracker has no tracked entries
        Assert.Empty(context.ChangeTracker.Entries());
    }
}
