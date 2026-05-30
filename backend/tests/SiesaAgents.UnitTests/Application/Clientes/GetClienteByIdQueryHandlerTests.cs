// Story 2.2: Client Detail View
// Unit Tests — GetClienteByIdQueryHandler
// AC covered: AC#2 (handler maps entity to DTO), AC#3 (null when not found)

using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using NSubstitute;
using Xunit;

namespace SiesaAgents.UnitTests.Application.Clientes;

public class GetClienteByIdQueryHandlerTests
{
    private readonly IClienteRepository _repository;
    private readonly GetClienteByIdQueryHandler _handler;

    public GetClienteByIdQueryHandlerTests()
    {
        _repository = Substitute.For<IClienteRepository>();
        _handler = new GetClienteByIdQueryHandler(_repository);
    }

    [Fact]
    public async Task GivenExistingId_WhenHandle_ThenReturnsClienteDto()
    {
        // Arrange
        var entity = ClienteEntity.Create("Ana García", "900-111-001", "3001111111", "Bogotá");
        _repository.GetByIdAsync(entity.Id, Arg.Any<CancellationToken>())
            .Returns(entity);

        // Act
        var result = await _handler.Handle(new GetClienteByIdQuery(entity.Id), CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(entity.Id, result.Id);
        Assert.Equal(entity.Nombre, result.Nombre);
        Assert.Equal(entity.NIT, result.NIT);
        Assert.Equal(entity.Telefono, result.Telefono);
        Assert.Equal(entity.Ciudad, result.Ciudad);
    }

    [Fact]
    public async Task GivenNonExistentId_WhenHandle_ThenReturnsNull()
    {
        // Arrange
        var id = Guid.NewGuid();
        _repository.GetByIdAsync(id, Arg.Any<CancellationToken>())
            .Returns((ClienteEntity?)null);

        // Act
        var result = await _handler.Handle(new GetClienteByIdQuery(id), CancellationToken.None);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GivenExistingId_WhenHandle_ThenMapsAllFieldsCorrectly()
    {
        // Arrange
        var entity = ClienteEntity.Create("Pedro Pérez", "800-222-002", "3002222222", "Medellín");
        _repository.GetByIdAsync(entity.Id, Arg.Any<CancellationToken>())
            .Returns(entity);

        // Act
        var result = await _handler.Handle(new GetClienteByIdQuery(entity.Id), CancellationToken.None);

        // Assert — every DTO field maps from the entity
        Assert.NotNull(result);
        Assert.Equal("Pedro Pérez", result.Nombre);
        Assert.Equal("800-222-002", result.NIT);
        Assert.Equal("3002222222", result.Telefono);
        Assert.Equal("Medellín", result.Ciudad);
    }

    [Fact]
    public async Task GivenCall_WhenHandle_ThenCallsRepositoryExactlyOnce()
    {
        // Arrange
        var id = Guid.NewGuid();
        _repository.GetByIdAsync(id, Arg.Any<CancellationToken>())
            .Returns((ClienteEntity?)null);

        // Act
        await _handler.Handle(new GetClienteByIdQuery(id), CancellationToken.None);

        // Assert
        await _repository.Received(1).GetByIdAsync(id, Arg.Any<CancellationToken>());
    }
}
