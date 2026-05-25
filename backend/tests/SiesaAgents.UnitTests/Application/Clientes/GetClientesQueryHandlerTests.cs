using NSubstitute;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
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

    [Fact]
    public async Task HandleAsync_EmptyRepository_ReturnsEmptyList()
    {
        // Arrange
        _repository.GetAllAsync(Arg.Any<CancellationToken>())
            .Returns(Enumerable.Empty<ClienteEntity>());

        // Act
        var result = await _handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public async Task HandleAsync_WithTwoClients_ReturnsTwoDtosWithCorrectMapping()
    {
        // Arrange
        var cliente1 = ClienteEntity.Create("Empresa ABC", "900123456-1", "+57 601 1234567", "Bogotá");
        var cliente2 = ClienteEntity.Create("Empresa XYZ", "800987654-2", null, null);

        _repository.GetAllAsync(Arg.Any<CancellationToken>())
            .Returns(new List<ClienteEntity> { cliente1, cliente2 });

        // Act
        var result = (await _handler.HandleAsync(new GetClientesQuery(), CancellationToken.None)).ToList();

        // Assert
        Assert.Equal(2, result.Count);

        var dto1 = result.First(d => d.NitRuc == "900123456-1");
        Assert.Equal(cliente1.Id, dto1.Id);
        Assert.Equal("Empresa ABC", dto1.Nombre);
        Assert.Equal("900123456-1", dto1.NitRuc);
        Assert.Equal("+57 601 1234567", dto1.Telefono);
        Assert.Equal("Bogotá", dto1.Ciudad);
        Assert.Equal(cliente1.CreadoEn, dto1.CreadoEn);

        var dto2 = result.First(d => d.NitRuc == "800987654-2");
        Assert.Equal(cliente2.Id, dto2.Id);
        Assert.Equal("Empresa XYZ", dto2.Nombre);
        Assert.Null(dto2.Telefono);
        Assert.Null(dto2.Ciudad);
    }
}
