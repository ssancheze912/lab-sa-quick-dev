// -----------------------------------------------------------------------------
//  Story 2.2 — Client Detail View
//  Unit tests for GetClienteByIdQueryHandler CQRS handler (AC #5, #8, #9).
//  Uses a hand-rolled fake IClienteRepository — no external mock library.
// -----------------------------------------------------------------------------
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

public class GetClienteByIdQueryHandlerTests
{
    private sealed class FakeClienteRepository : IClienteRepository
    {
        public ClienteEntity? SeedOne { get; init; }
        public int GetByIdCallCount { get; private set; }
        public Guid? LastRequestedId { get; private set; }
        public CancellationToken LastCancellationToken { get; private set; }

        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            return Task.FromResult<IReadOnlyList<ClienteEntity>>(Array.Empty<ClienteEntity>());
        }

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            GetByIdCallCount++;
            LastRequestedId = id;
            LastCancellationToken = cancellationToken;
            if (SeedOne is not null && SeedOne.Id == id)
            {
                return Task.FromResult<ClienteEntity?>(SeedOne);
            }
            return Task.FromResult<ClienteEntity?>(null);
        }
    }

    [Fact]
    public async Task HandleAsync_ExistingId_ReturnsDtoWithAllSevenFields()
    {
        var entity = ClienteEntity.Create("Acme Corp", "900123456-7", "+57 300 111 1111", "Cali");
        var repo = new FakeClienteRepository { SeedOne = entity };
        var handler = new GetClienteByIdQueryHandler(repo);

        var result = await handler.HandleAsync(new GetClienteByIdQuery(entity.Id));

        Assert.NotNull(result);
        Assert.Equal(entity.Id, result!.Id);
        Assert.Equal(entity.Nombre, result.Nombre);
        Assert.Equal(entity.Nit, result.Nit);
        Assert.Equal(entity.Telefono, result.Telefono);
        Assert.Equal(entity.Ciudad, result.Ciudad);
        Assert.Equal(entity.CreatedAt, result.CreatedAt);
        Assert.Equal(entity.UpdatedAt, result.UpdatedAt);
        Assert.Equal(1, repo.GetByIdCallCount);
        Assert.Equal(entity.Id, repo.LastRequestedId);
    }

    [Fact]
    public async Task HandleAsync_UnknownId_ReturnsNull()
    {
        var repo = new FakeClienteRepository();
        var handler = new GetClienteByIdQueryHandler(repo);
        var unknownId = Guid.NewGuid();

        var result = await handler.HandleAsync(new GetClienteByIdQuery(unknownId));

        Assert.Null(result);
        Assert.Equal(1, repo.GetByIdCallCount);
        Assert.Equal(unknownId, repo.LastRequestedId);
    }

    [Fact]
    public async Task HandleAsync_PassesCancellationTokenToRepository()
    {
        var repo = new FakeClienteRepository();
        var handler = new GetClienteByIdQueryHandler(repo);
        using var cts = new CancellationTokenSource();

        var result = await handler.HandleAsync(new GetClienteByIdQuery(Guid.NewGuid()), cts.Token);

        Assert.Null(result);
        Assert.Equal(cts.Token, repo.LastCancellationToken);
    }

    [Fact]
    public async Task HandleAsync_TimestampsRoundTripAsDateTimeOffset()
    {
        var entity = ClienteEntity.Create("Beta", "800987654-3", "+57 301", "Bogotá");
        var repo = new FakeClienteRepository { SeedOne = entity };
        var handler = new GetClienteByIdQueryHandler(repo);

        var result = await handler.HandleAsync(new GetClienteByIdQuery(entity.Id));

        Assert.NotNull(result);
        Assert.IsType<DateTimeOffset>(result!.CreatedAt);
        Assert.IsType<DateTimeOffset>(result.UpdatedAt);
    }
}
