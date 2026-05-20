using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Handlers;

/// <summary>
/// Edge case unit tests for GetClientesQueryHandler — Story 2.1 expansion.
///
/// Test IDs: UNIT-B-GET-EDGE-01 … UNIT-B-GET-EDGE-04
/// </summary>
public class GetClientesQueryHandlerEdgeCaseTests
{
    // ---------------------------------------------------------------------------
    // UNIT-B-GET-EDGE-01: Handler maps all optional fields (Telefono, Ciudad) correctly
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task HandleAsync_WithClientes_MapsAllFields()
    {
        var clientes = new List<ClienteEntity>
        {
            ClienteEntity.Create("Empresa Alpha SAS", "900100001-0", "+57 1 234 5678", "Bogotá"),
        };
        var repository = new FakeClienteRepository(clientes);
        var handler = new GetClientesQueryHandler(repository);

        var result = (await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None)).ToList();

        Assert.Single(result);
        Assert.Equal("+57 1 234 5678", result[0].Telefono);
        Assert.Equal("Bogotá", result[0].Ciudad);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-GET-EDGE-02: Handler maps CreatedAt and UpdatedAt as DateTimeOffset
    // Boundary: DTO fields must be DateTimeOffset (with timezone) not plain DateTime
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task HandleAsync_WithClientes_MapsCreatedAtAndUpdatedAtAsDateTimeOffset()
    {
        var entity = ClienteEntity.Create("Empresa Beta", "900100002-1", "300", "Cali");
        var repository = new FakeClienteRepository(new List<ClienteEntity> { entity });
        var handler = new GetClientesQueryHandler(repository);

        var result = (await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None)).ToList();

        // DateTimeOffset has an Offset property; plain DateTime does not.
        // CreatedAt and UpdatedAt on ClienteEntity are DateTimeOffset.UtcNow → offset = 0.
        Assert.Equal(TimeSpan.Zero, result[0].CreatedAt.Offset);
        Assert.Equal(TimeSpan.Zero, result[0].UpdatedAt.Offset);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-GET-EDGE-03: Handler propagates exception thrown by repository
    // Error path: if the DB call fails, the exception must surface to the caller.
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task HandleAsync_RepositoryThrows_PropagatesException()
    {
        var repository = new ThrowingClienteRepository(new Exception("DB connection lost"));
        var handler = new GetClientesQueryHandler(repository);

        await Assert.ThrowsAsync<Exception>(
            () => handler.HandleAsync(new GetClientesQuery(), CancellationToken.None));
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-GET-EDGE-04: Handler with large number of clients returns all of them
    // Boundary: no accidental paging or limit inside handler.
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task HandleAsync_WithManyClientes_ReturnsAllItems()
    {
        var clientes = Enumerable.Range(1, 100)
            .Select(i => ClienteEntity.Create($"Empresa {i}", $"90000{i:D4}-{i % 10}", "300", "Bogotá"))
            .ToList();
        var repository = new FakeClienteRepository(clientes);
        var handler = new GetClientesQueryHandler(repository);

        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);

        Assert.Equal(100, result.Count());
    }

    // ---------------------------------------------------------------------------
    // Fakes
    // ---------------------------------------------------------------------------

    private sealed class FakeClienteRepository : IClienteRepository
    {
        private readonly IEnumerable<ClienteEntity> _data;

        public FakeClienteRepository(IEnumerable<ClienteEntity> data) => _data = data;

        public Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult(_data);

        public Task CreateAsync(ClienteEntity cliente, CancellationToken ct)
            => Task.CompletedTask;

        public Task DeleteAsync(Guid id, CancellationToken ct)
            => Task.CompletedTask;
    }

    private sealed class ThrowingClienteRepository : IClienteRepository
    {
        private readonly Exception _exception;

        public ThrowingClienteRepository(Exception exception) => _exception = exception;

        public Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromException<IEnumerable<ClienteEntity>>(_exception);

        public Task CreateAsync(ClienteEntity cliente, CancellationToken ct)
            => Task.CompletedTask;

        public Task DeleteAsync(Guid id, CancellationToken ct)
            => Task.CompletedTask;
    }
}
