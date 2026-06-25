using FluentAssertions;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using Xunit;

namespace SiesaAgents.UnitTests.Application.Clientes;

// ─── Fake Repository ──────────────────────────────────────────────────────────

file sealed class FakeClienteByIdRepository(ClienteEntity? entity = null) : IClienteRepository
{
    public Task<IEnumerable<ClienteEntity>> GetAllAsync()
        => Task.FromResult<IEnumerable<ClienteEntity>>([]);

    public Task<ClienteEntity?> GetByIdAsync(Guid id)
        => Task.FromResult(entity?.Id == id ? entity : null);

    public Task<ClienteEntity> CreateAsync(ClienteEntity e)
        => Task.FromResult(e);

    public Task<ClienteEntity> UpdateAsync(ClienteEntity e)
        => Task.FromResult(e);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

public class GetClienteByIdQueryHandlerTests
{
    private static ClienteEntity MakeCliente(string nombre = "Empresa Test", string nit = "900000001-0")
        => ClienteEntity.Create(nombre, nit, "6011234567", "Bogotá");

    [Fact]
    public async Task HandleAsync_WhenClientExists_ReturnsClienteDto()
    {
        // Arrange
        var cliente = MakeCliente("Inversiones Delta S.A.", "900123456-7");
        var handler = new GetClienteByIdQueryHandler(new FakeClienteByIdRepository(cliente));

        // Act
        var result = await handler.HandleAsync(new GetClienteByIdQuery(cliente.Id));

        // Assert
        result.Should().NotBeNull();
        result.Should().BeOfType<ClienteDto>();
        result!.Id.Should().Be(cliente.Id);
        result.Nombre.Should().Be("Inversiones Delta S.A.");
        result.Nit.Should().Be("900123456-7");
        result.Telefono.Should().Be("6011234567");
        result.Ciudad.Should().Be("Bogotá");
        result.CreatedAt.Should().Be(cliente.CreatedAt);
        result.UpdatedAt.Should().Be(cliente.UpdatedAt);
    }

    [Fact]
    public async Task HandleAsync_WhenClientDoesNotExist_ReturnsNull()
    {
        // Arrange
        var handler = new GetClienteByIdQueryHandler(new FakeClienteByIdRepository(entity: null));

        // Act
        var result = await handler.HandleAsync(new GetClienteByIdQuery(Guid.NewGuid()));

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task HandleAsync_WhenQueryingDifferentId_ReturnsNull()
    {
        // Arrange — repository has a client but the query ID doesn't match
        var cliente = MakeCliente("Empresa Existente", "900999999-1");
        var handler = new GetClienteByIdQueryHandler(new FakeClienteByIdRepository(cliente));

        // Act
        var result = await handler.HandleAsync(new GetClienteByIdQuery(Guid.NewGuid()));

        // Assert
        result.Should().BeNull();
    }
}
