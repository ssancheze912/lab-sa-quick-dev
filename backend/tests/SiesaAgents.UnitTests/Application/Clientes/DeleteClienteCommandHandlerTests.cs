using FluentAssertions;
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using Xunit;

namespace SiesaAgents.UnitTests.Application.Clientes;

// ─── Fake Repository ──────────────────────────────────────────────────────────

file sealed class FakeDeleteClienteRepository : IClienteRepository
{
    private readonly List<ClienteEntity> _store = [];

    public FakeDeleteClienteRepository(IEnumerable<ClienteEntity>? seed = null)
    {
        if (seed is not null) _store.AddRange(seed);
    }

    public Task<IEnumerable<ClienteEntity>> GetAllAsync()
        => Task.FromResult<IEnumerable<ClienteEntity>>(_store);

    public Task<ClienteEntity?> GetByIdAsync(Guid id)
        => Task.FromResult(_store.FirstOrDefault(e => e.Id == id));

    public Task<ClienteEntity> CreateAsync(ClienteEntity entity)
    {
        _store.Add(entity);
        return Task.FromResult(entity);
    }

    public Task<ClienteEntity> UpdateAsync(ClienteEntity entity)
        => Task.FromResult(entity);

    public Task<bool> DeleteAsync(Guid id)
    {
        var removed = _store.RemoveAll(e => e.Id == id) > 0;
        return Task.FromResult(removed);
    }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

public class DeleteClienteCommandHandlerTests
{
    private static ClienteEntity MakeCliente(
        string nombre = "Empresa Test",
        string nit = "900000001-0")
        => ClienteEntity.Create(nombre, nit, "6011234567", "Bogotá");

    [Fact]
    public async Task HandleAsync_WhenClientExists_ReturnsTrue()
    {
        // Arrange
        var cliente = MakeCliente();
        var repo = new FakeDeleteClienteRepository(seed: [cliente]);
        var handler = new DeleteClienteCommandHandler(repo);

        // Act
        var result = await handler.HandleAsync(new DeleteClienteCommand(cliente.Id));

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task HandleAsync_WhenClientDoesNotExist_ReturnsFalse()
    {
        // Arrange — empty repository, unknown ID
        var repo = new FakeDeleteClienteRepository();
        var handler = new DeleteClienteCommandHandler(repo);

        // Act
        var result = await handler.HandleAsync(new DeleteClienteCommand(Guid.NewGuid()));

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task HandleAsync_WhenClientDeleted_IsNoLongerRetrievable()
    {
        // Arrange
        var cliente = MakeCliente("Empresa Eliminada S.A.", "900123456-7");
        var repo = new FakeDeleteClienteRepository(seed: [cliente]);
        var handler = new DeleteClienteCommandHandler(repo);

        // Act
        await handler.HandleAsync(new DeleteClienteCommand(cliente.Id));

        // Assert — client no longer in repository
        var found = await repo.GetByIdAsync(cliente.Id);
        found.Should().BeNull();
    }
}
