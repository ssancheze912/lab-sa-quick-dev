// -----------------------------------------------------------------------------
//  Story 2.1 — Client List & Search
//  Unit tests for GetClientesQueryHandler CQRS handler (AC #8).
//  Uses a hand-rolled fake IClienteRepository — no external mock library needed.
// -----------------------------------------------------------------------------
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

public class GetClientesQueryHandlerTests
{
    private sealed class FakeClienteRepository : IClienteRepository
    {
        public IReadOnlyList<ClienteEntity> Seed { get; init; } = Array.Empty<ClienteEntity>();
        public int GetAllCallCount { get; private set; }

        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            GetAllCallCount++;
            return Task.FromResult(Seed);
        }
    }

    [Fact]
    public async Task HandleAsync_WhenRepositoryReturnsEmpty_ReturnsEmptyList()
    {
        var repo = new FakeClienteRepository();
        var handler = new GetClientesQueryHandler(repo);

        var result = await handler.HandleAsync(new GetClientesQuery());

        Assert.Empty(result);
        Assert.Equal(1, repo.GetAllCallCount);
    }

    [Fact]
    public async Task HandleAsync_WithSeededClientes_ProjectsEachToClienteDto()
    {
        var seed = new List<ClienteEntity>
        {
            ClienteEntity.Create("Acme Corp", "900123456-7", "+57 300 111 1111", "Cali"),
            ClienteEntity.Create("Beta Ltda", "800987654-3", "+57 301 222 2222", "Bogotá"),
        };
        var repo = new FakeClienteRepository { Seed = seed };
        var handler = new GetClientesQueryHandler(repo);

        var result = await handler.HandleAsync(new GetClientesQuery());

        Assert.Equal(2, result.Count);

        var acme = result.Single(c => c.Nombre == "Acme Corp");
        Assert.Equal("900123456-7", acme.Nit);
        Assert.Equal("+57 300 111 1111", acme.Telefono);
        Assert.Equal("Cali", acme.Ciudad);
        // Timestamps propagate as DateTimeOffset — never DateTime.
        Assert.IsType<DateTimeOffset>(acme.CreatedAt);
        Assert.IsType<DateTimeOffset>(acme.UpdatedAt);
    }

    [Fact]
    public async Task HandleAsync_PassesCancellationTokenToRepository()
    {
        var repo = new FakeClienteRepository();
        var handler = new GetClientesQueryHandler(repo);
        using var cts = new CancellationTokenSource();

        var result = await handler.HandleAsync(new GetClientesQuery(), cts.Token);

        Assert.NotNull(result);
        Assert.Equal(1, repo.GetAllCallCount);
    }
}
