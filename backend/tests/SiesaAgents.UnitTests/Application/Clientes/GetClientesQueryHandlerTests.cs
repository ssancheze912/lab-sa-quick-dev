using FluentAssertions;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using Xunit;

namespace SiesaAgents.UnitTests.Application.Clientes;

// ─── Fake Repository ──────────────────────────────────────────────────────────

file sealed class FakeClienteRepository(IEnumerable<ClienteEntity>? items = null, Exception? throws = null) : IClienteRepository
{
    private readonly IEnumerable<ClienteEntity> _items = items ?? [];
    private readonly Exception? _throws = throws;

    public Task<IEnumerable<ClienteEntity>> GetAllAsync()
    {
        if (_throws is not null) throw _throws;
        return Task.FromResult(_items);
    }

    public Task<ClienteEntity?> GetByIdAsync(Guid id)
        => Task.FromResult(_items.FirstOrDefault(e => e.Id == id));

    public Task<ClienteEntity> CreateAsync(ClienteEntity entity)
        => Task.FromResult(entity);

    public Task<ClienteEntity> UpdateAsync(ClienteEntity entity)
        => Task.FromResult(entity);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

public class GetClientesQueryHandlerTests
{
    private static ClienteEntity MakeCliente(string nombre = "Empresa Test", string nit = "900000001-0")
        => ClienteEntity.Create(nombre, nit, "6011234567", "Bogotá");

    [Fact]
    public async Task HandleAsync_WhenNoClients_ReturnsEmptyList()
    {
        // Arrange
        var handler = new GetClientesQueryHandler(new FakeClienteRepository());

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery());

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task HandleAsync_WhenClientsExist_ReturnsMappedClienteDtos()
    {
        // Arrange
        var cliente = MakeCliente("Acme SA", "900123456-1");
        var handler = new GetClientesQueryHandler(new FakeClienteRepository([cliente]));

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery());

        // Assert
        var dto = result.Should().ContainSingle().Subject;
        dto.Should().BeOfType<ClienteDto>();
        dto.Id.Should().Be(cliente.Id);
        dto.Nombre.Should().Be("Acme SA");
        dto.Nit.Should().Be("900123456-1");
        dto.Telefono.Should().Be("6011234567");
        dto.Ciudad.Should().Be("Bogotá");
        dto.CreatedAt.Should().Be(cliente.CreatedAt);
        dto.UpdatedAt.Should().Be(cliente.UpdatedAt);
    }

    [Fact]
    public async Task HandleAsync_ReturnsClientsOrderedByCreatedAtDescending()
    {
        // Arrange — create two clients, the first created will have an earlier timestamp
        var older = MakeCliente("Empresa Antigua", "900000001-1");
        // Give newer a slightly later CreatedAt by checking the order from the handler
        var newer = MakeCliente("Empresa Nueva", "900000002-2");

        // Both are created with DateTimeOffset.UtcNow; ordering may be same-millisecond
        // We verify the handler orders by CreatedAt desc regardless
        var handler = new GetClientesQueryHandler(new FakeClienteRepository([older, newer]));

        // Act
        var result = (await handler.HandleAsync(new GetClientesQuery())).ToList();

        // Assert
        result.Should().HaveCount(2);
        // Verify descending order: first item has >= CreatedAt compared to second
        result[0].CreatedAt.Should().BeOnOrAfter(result[1].CreatedAt);
    }

    [Fact]
    public async Task HandleAsync_WhenRepositoryThrows_PropagatesException()
    {
        // Arrange
        var repository = new FakeClienteRepository(throws: new InvalidOperationException("DB connection failed"));
        var handler = new GetClientesQueryHandler(repository);

        // Act
        Func<Task> act = () => handler.HandleAsync(new GetClientesQuery());

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("DB connection failed");
    }
}
