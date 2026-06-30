using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Xunit;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Edge-case tests for GetClientesQueryHandler (Story 2.1).
/// Covers: cancellation forwarding, exception propagation, DTO field types,
/// large dataset handling, single-item response, and ordering invariants.
/// Primary ATDD tests live in GetClientesQueryHandlerTests.cs.
/// </summary>
public class GetClientesQueryHandlerEdgeCaseTests
{
    // ─────────────────────────────────────────────────────────────────────
    // Fakes
    // ─────────────────────────────────────────────────────────────────────

    private sealed class FakeClienteRepository : IClienteRepository
    {
        private readonly IEnumerable<ClienteEntity> _clientes;

        public FakeClienteRepository(IEnumerable<ClienteEntity> clientes)
        {
            _clientes = clientes;
        }

        public Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)
        {
            ct.ThrowIfCancellationRequested();
            return Task.FromResult(_clientes);
        }

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromResult(_clientes.FirstOrDefault(c => c.Id == id));

        public Task<ClienteEntity> CreateAsync(ClienteEntity cliente, CancellationToken ct)
            => Task.FromResult(cliente);

        public Task<bool> DeleteAsync(Guid id, CancellationToken ct)
            => Task.FromResult(true);
    }

    private sealed class ThrowingClienteRepository : IClienteRepository
    {
        private readonly Exception _exception;

        public ThrowingClienteRepository(Exception exception)
        {
            _exception = exception;
        }

        public Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromException<IEnumerable<ClienteEntity>>(_exception);

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromException<ClienteEntity?>(_exception);

        public Task<ClienteEntity> CreateAsync(ClienteEntity cliente, CancellationToken ct)
            => Task.FromException<ClienteEntity>(_exception);

        public Task<bool> DeleteAsync(Guid id, CancellationToken ct)
            => Task.FromException<bool>(_exception);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Cancellation
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_CancelledToken_ThrowsOperationCanceledException()
    {
        // Arrange
        var repository = new FakeClienteRepository([ClienteEntity.Create("Test", "123", "300", "Bogotá")]);
        var handler = new GetClientesQueryHandler(repository);
        using var cts = new CancellationTokenSource();
        cts.Cancel();

        // Act & Assert
        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => handler.Handle(new GetClientesQuery(), cts.Token));
    }

    // ─────────────────────────────────────────────────────────────────────
    // Exception propagation
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_RepositoryThrowsException_PropagatesException()
    {
        // Arrange: repository that always throws
        var expectedException = new InvalidOperationException("Database connection lost");
        var repository = new ThrowingClienteRepository(expectedException);
        var handler = new GetClientesQueryHandler(repository);

        // Act & Assert: handler propagates the original exception
        var thrown = await Assert.ThrowsAsync<InvalidOperationException>(
            () => handler.Handle(new GetClientesQuery(), CancellationToken.None));

        Assert.Equal("Database connection lost", thrown.Message);
    }

    // ─────────────────────────────────────────────────────────────────────
    // DTO field types and values
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_SingleCliente_DtoIdMatchesEntityId()
    {
        // Arrange: single entity with a known Guid
        var cliente = ClienteEntity.Create("Solo Corp", "555000111-0", "3001111111", "Cali");
        var repository = new FakeClienteRepository([cliente]);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.Handle(new GetClientesQuery(), CancellationToken.None);

        // Assert: DTO Id is the same Guid as the entity Id
        var dto = result.Single();
        Assert.Equal(cliente.Id, dto.Id);
        Assert.IsType<Guid>(dto.Id);
    }

    [Fact]
    public async Task Handle_SingleCliente_CreatedAtAndUpdatedAtAreUtc()
    {
        // Arrange
        var cliente = ClienteEntity.Create("UTC Corp", "111222333-4", "3009999999", "Barranquilla");
        var repository = new FakeClienteRepository([cliente]);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.Handle(new GetClientesQuery(), CancellationToken.None);

        // Assert: timestamps are UTC (offset = 0)
        var dto = result.Single();
        Assert.Equal(TimeSpan.Zero, dto.CreatedAt.Offset);
        Assert.Equal(TimeSpan.Zero, dto.UpdatedAt.Offset);
    }

    [Fact]
    public async Task Handle_SingleCliente_DtoTelfonoAndCiudadMatchEntity()
    {
        // Arrange: verifies all DTO fields are mapped (not just nombre/nit)
        var cliente = ClienteEntity.Create("Mapa Corp", "900000999-5", "3155555555", "Manizales");
        var repository = new FakeClienteRepository([cliente]);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.Handle(new GetClientesQuery(), CancellationToken.None);

        // Assert
        var dto = result.Single();
        Assert.Equal("3155555555", dto.Telefono);
        Assert.Equal("Manizales", dto.Ciudad);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Large dataset
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_LargeDataset_ReturnsAllItems()
    {
        // Arrange: 500 entities (simulates NFR1 performance boundary)
        var entities = Enumerable.Range(1, 500)
            .Select(i => ClienteEntity.Create($"Empresa {i:D4}", $"9{i:D8}-0", "3000000000", "Bogotá"))
            .ToList();

        var repository = new FakeClienteRepository(entities);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.Handle(new GetClientesQuery(), CancellationToken.None);

        // Assert: all 500 are returned
        Assert.Equal(500, result.Count());
    }

    // ─────────────────────────────────────────────────────────────────────
    // Idempotency
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_CalledTwice_ReturnsSameData()
    {
        // Arrange: deterministic single entity
        var cliente = ClienteEntity.Create("Idem Corp", "100200300-1", "3000000001", "Bogotá");
        var repository = new FakeClienteRepository([cliente]);
        var handler = new GetClientesQueryHandler(repository);

        // Act: call handler twice
        var result1 = (await handler.Handle(new GetClientesQuery(), CancellationToken.None)).ToList();
        var result2 = (await handler.Handle(new GetClientesQuery(), CancellationToken.None)).ToList();

        // Assert: both calls return equivalent data
        Assert.Equal(result1.Count, result2.Count);
        Assert.Equal(result1[0].Id, result2[0].Id);
        Assert.Equal(result1[0].Nombre, result2[0].Nombre);
    }
}
