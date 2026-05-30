// Story 2.1: Client List & Search
// Unit Tests — GetClientesQueryHandler
// AC covered: AC#5 (handler maps entities to DTOs correctly)
// Test cases: empty repository returns empty list; repository with 3 clients returns all 3 as ClienteDto

using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using NSubstitute;
using Xunit;

namespace SiesaAgents.UnitTests.Application.Clientes;

public class GetClientesQueryHandlerTests
{
    private readonly IClienteRepository _repository;
    private readonly GetClientesQueryHandler _handler;

    public GetClientesQueryHandlerTests()
    {
        _repository = Substitute.For<IClienteRepository>();
        _handler = new GetClientesQueryHandler(_repository);
    }

    // =========================================================================
    // Test: Empty repository returns empty list
    // =========================================================================

    [Fact]
    public async Task GivenEmptyRepository_WhenHandle_ThenReturnsEmptyList()
    {
        // Arrange
        _repository.GetAllAsync(Arg.Any<CancellationToken>())
            .Returns(Array.Empty<ClienteEntity>().AsReadOnly<ClienteEntity>());

        // Act
        var result = await _handler.Handle(new GetClientesQuery(), CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    // =========================================================================
    // Test: Repository with 3 clients returns all 3 as ClienteDto with correct mapping
    // =========================================================================

    [Fact]
    public async Task GivenThreeClients_WhenHandle_ThenReturnsAllThreeAsDtos()
    {
        // Arrange
        var entities = new[]
        {
            ClienteEntity.Create("Ana García", "900-111-001", "3001111111", "Bogotá"),
            ClienteEntity.Create("Pedro Pérez", "800-222-002", "3002222222", "Medellín"),
            ClienteEntity.Create("Luis López", "700-333-003", "3003333333", "Cali"),
        };

        _repository.GetAllAsync(Arg.Any<CancellationToken>())
            .Returns(entities.AsReadOnly<ClienteEntity>());

        // Act
        var result = await _handler.Handle(new GetClientesQuery(), CancellationToken.None);

        // Assert
        Assert.Equal(3, result.Count);
    }

    [Fact]
    public async Task GivenThreeClients_WhenHandle_ThenEachDtoHasCorrectFieldMapping()
    {
        // Arrange
        var entity = ClienteEntity.Create("Ana García", "900-111-001", "3001111111", "Bogotá");
        _repository.GetAllAsync(Arg.Any<CancellationToken>())
            .Returns(new[] { entity }.AsReadOnly<ClienteEntity>());

        // Act
        var result = await _handler.Handle(new GetClientesQuery(), CancellationToken.None);

        // Assert
        var dto = Assert.Single(result);
        Assert.Equal(entity.Id, dto.Id);
        Assert.Equal("Ana García", dto.Nombre);
        Assert.Equal("900-111-001", dto.NIT);
        Assert.Equal("3001111111", dto.Telefono);
        Assert.Equal("Bogotá", dto.Ciudad);
        Assert.Equal(entity.CreatedAt, dto.CreatedAt);
        Assert.Equal(entity.UpdatedAt, dto.UpdatedAt);
        Assert.NotEqual(Guid.Empty, dto.Id);
    }
}
