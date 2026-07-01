using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Postgres-independent tests for <see cref="GetClientesQueryHandler"/> — Story 2.1.
///
/// The handler is a straight projection: entity → <see cref="ClienteDto"/> preserving order.
/// A fake <see cref="IClienteRepository"/> keeps the tests DB-free.
/// </summary>
public class GetClientesQueryHandlerTests
{
    private sealed class FakeClienteRepository(List<ClienteEntity> data) : IClienteRepository
    {
        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<ClienteEntity>>(data);
    }

    [Fact(DisplayName = "[P1][unit] Handler returns empty list when repository is empty")]
    public async Task Handle_ReturnsEmpty_WhenRepositoryEmpty()
    {
        var handler = new GetClientesQueryHandler(new FakeClienteRepository([]));

        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);

        Assert.NotNull(result);
        Assert.Empty(result);
    }

    [Fact(DisplayName = "[P1][unit] Handler projects entities to ClienteDto preserving order")]
    public async Task Handle_ProjectsEntities_PreservingOrder()
    {
        var a = ClienteEntity.Create("Acme", "900123456", "3001111111", "Bogotá");
        var b = ClienteEntity.Create("Peña", "800987654", "3002222222", "Medellín");
        var c = ClienteEntity.Create("Global", "901555444", "3003333333", "Cali");

        var handler = new GetClientesQueryHandler(new FakeClienteRepository([a, b, c]));

        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);

        Assert.Equal(3, result.Count);
        Assert.Equal(a.Id, result[0].Id);
        Assert.Equal("Acme", result[0].Nombre);
        Assert.Equal("900123456", result[0].Nit);
        Assert.Equal("Peña", result[1].Nombre);
        Assert.Equal("Global", result[2].Nombre);
    }

    [Fact(DisplayName = "[P2][unit] Handler forwards CreatedAt/UpdatedAt as-is")]
    public async Task Handle_ForwardsAuditTimestamps()
    {
        var entity = ClienteEntity.Create("Acme", "900123456", "3001111111", "Bogotá");
        var handler = new GetClientesQueryHandler(new FakeClienteRepository([entity]));

        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);

        Assert.Single(result);
        Assert.Equal(entity.CreatedAt, result[0].CreatedAt);
        Assert.Equal(entity.UpdatedAt, result[0].UpdatedAt);
    }
}
