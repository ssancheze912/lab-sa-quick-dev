using Microsoft.EntityFrameworkCore;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Data;
using SiesaAgents.Infrastructure.Repositories;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Unit tests for GetClientesQueryHandler — Story 2.1, Task 11.
/// Uses EF Core InMemory database to isolate from PostgreSQL.
/// Pattern: Arrange / Act / Assert
/// </summary>
public sealed class GetClientesQueryHandlerTests
{
    private static AppDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task HandleAsync_WhenRepositoryReturnsNoClients_ReturnsEmptyList()
    {
        // Arrange
        using var context = CreateInMemoryContext();
        IClienteRepository repository = new ClienteRepository(context);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery());

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    [Fact]
    public async Task HandleAsync_WhenRepositoryReturnsClients_ReturnsMappedDtoList()
    {
        // Arrange
        using var context = CreateInMemoryContext();

        var cliente1 = ClienteEntity.Create("Empresa Alfa", "123456789", "3001234567", "Bogotá");
        var cliente2 = ClienteEntity.Create("Compañía Beta", "987654321", "3109876543", "Medellín");
        context.Clientes.AddRange(cliente1, cliente2);
        await context.SaveChangesAsync();

        IClienteRepository repository = new ClienteRepository(context);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = (await handler.HandleAsync(new GetClientesQuery())).ToList();

        // Assert
        Assert.Equal(2, result.Count);

        var alfa = result.Single(c => c.Nombre == "Empresa Alfa");
        Assert.Equal(cliente1.Id, alfa.Id);
        Assert.Equal("123456789", alfa.Nit);
        Assert.Equal("3001234567", alfa.Telefono);
        Assert.Equal("Bogotá", alfa.Ciudad);

        var beta = result.Single(c => c.Nombre == "Compañía Beta");
        Assert.Equal(cliente2.Id, beta.Id);
        Assert.Equal("987654321", beta.Nit);
    }

    [Fact]
    public async Task HandleAsync_MappedDtos_HaveCorrectTimestamps()
    {
        // Arrange
        using var context = CreateInMemoryContext();

        var before = DateTimeOffset.UtcNow.AddSeconds(-1);
        var cliente = ClienteEntity.Create("Test SA", "111222333", "3200000000", "Cali");
        context.Clientes.Add(cliente);
        await context.SaveChangesAsync();
        var after = DateTimeOffset.UtcNow.AddSeconds(1);

        IClienteRepository repository = new ClienteRepository(context);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = (await handler.HandleAsync(new GetClientesQuery())).ToList();

        // Assert
        Assert.Single(result);
        var dto = result[0];
        Assert.True(dto.CreatedAt >= before && dto.CreatedAt <= after);
        Assert.True(dto.UpdatedAt >= before && dto.UpdatedAt <= after);
    }
}
