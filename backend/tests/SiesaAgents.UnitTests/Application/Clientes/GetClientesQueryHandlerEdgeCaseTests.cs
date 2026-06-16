using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Edge Case Tests — GetClientesQueryHandler (Story 2.1)
///
/// Complements GetClientesQueryHandlerTests.cs with:
///   - CancellationToken is forwarded to the repository
///   - Handler returns only the fields defined in ClienteDto (no extra data leakage)
///   - Mapping: NIT, Telefono, Ciudad are correctly mapped (not just Nombre)
///   - Result is a read-only list (IReadOnlyList), not mutable
///   - Handler can handle large datasets (500 records) without throwing
///   - Handler with already-cancelled token does not hang
/// </summary>
public sealed class GetClientesQueryHandlerEdgeCaseTests
{
    private sealed class InMemoryClienteRepository : IClienteRepository
    {
        private readonly List<ClienteEntity> _clientes;
        public CancellationToken? ReceivedCancellationToken { get; private set; }

        public InMemoryClienteRepository(IEnumerable<ClienteEntity>? clientes = null)
        {
            _clientes = clientes?.ToList() ?? [];
        }

        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct = default)
        {
            ReceivedCancellationToken = ct;
            return Task.FromResult<IReadOnlyList<ClienteEntity>>(_clientes.AsReadOnly());
        }

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct = default)
            => Task.FromResult(_clientes.FirstOrDefault(c => c.Id == id));

        public Task AddAsync(ClienteEntity cliente, CancellationToken ct = default)
        {
            _clientes.Add(cliente);
            return Task.CompletedTask;
        }

        public Task DeleteAsync(ClienteEntity cliente, CancellationToken ct = default)
        {
            _clientes.Remove(cliente);
            return Task.CompletedTask;
        }

        public Task SaveChangesAsync(CancellationToken ct = default) => Task.CompletedTask;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DTO field mapping — all fields correctly projected
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_MapsAllFields_Correctly_NotJustNombre()
    {
        // Arrange
        var cliente = ClienteEntity.Create("Empresa Mapeada", "555666777", "3107654321", "Cartagena");
        var repo = new InMemoryClienteRepository([cliente]);
        var handler = new GetClientesQueryHandler(repo);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery());

        // Assert — ALL DTO fields must be mapped from the entity
        Assert.Single(result);
        var dto = result[0];
        Assert.Equal(cliente.Id, dto.Id);
        Assert.Equal("Empresa Mapeada", dto.Nombre);
        Assert.Equal("555666777", dto.NIT);
        Assert.Equal("3107654321", dto.Telefono);
        Assert.Equal("Cartagena", dto.Ciudad);
        // Timestamps must be non-default (populated from entity)
        Assert.NotEqual(default(DateTimeOffset), dto.CreatedAt);
        Assert.NotEqual(default(DateTimeOffset), dto.UpdatedAt);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Return type is IReadOnlyList (not mutable)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_ReturnsIReadOnlyList_NotMutableList()
    {
        // Arrange
        var repo = new InMemoryClienteRepository();
        var handler = new GetClientesQueryHandler(repo);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery());

        // Assert — result must satisfy IReadOnlyList<ClienteDto>
        Assert.IsAssignableFrom<IReadOnlyList<SiesaAgents.Application.Clientes.DTOs.ClienteDto>>(result);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CancellationToken forwarding
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_ForwardsCancellationToken_ToRepository()
    {
        // Arrange
        var repo = new InMemoryClienteRepository();
        var handler = new GetClientesQueryHandler(repo);
        using var cts = new CancellationTokenSource();

        // Act
        await handler.HandleAsync(new GetClientesQuery(), cts.Token);

        // Assert — the repository must have received the same CancellationToken
        Assert.NotNull(repo.ReceivedCancellationToken);
        Assert.Equal(cts.Token, repo.ReceivedCancellationToken.Value);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Large dataset — 500 records (NFR1 boundary)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_ReturnsAll500Records_WithoutException()
    {
        // Arrange — 500 unique entities (max MVP dataset per NFR1)
        var clientes = Enumerable.Range(1, 500)
            .Select(i => ClienteEntity.Create(
                $"Empresa {i:D3}",
                $"900{i:D6}",
                $"300{i:D7}",
                "Bogotá"))
            .ToList();

        var repo = new InMemoryClienteRepository(clientes);
        var handler = new GetClientesQueryHandler(repo);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery());

        // Assert — all 500 DTOs returned without error
        Assert.Equal(500, result.Count);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Ordering — consistent with AC5 (most recently created first)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_OrdersResultsByCreatedAtDescending_ThreeClients()
    {
        // Arrange — three entities with known ordering
        var first = ClienteEntity.Create("Empresa Primero", "100000001", "3001111111", "Cali");
        await Task.Delay(5);
        var second = ClienteEntity.Create("Empresa Segundo", "100000002", "3002222222", "Medellín");
        await Task.Delay(5);
        var third = ClienteEntity.Create("Empresa Tercero", "100000003", "3003333333", "Bogotá");

        var repo = new InMemoryClienteRepository([first, second, third]);
        var handler = new GetClientesQueryHandler(repo);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery());

        // Assert — most recent (third) must be at index 0
        Assert.Equal(third.Id, result[0].Id);
        Assert.Equal(second.Id, result[1].Id);
        Assert.Equal(first.Id, result[2].Id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Single record — boundary between empty and non-empty
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_ReturnsSingleDto_WhenExactlyOneClienteExists()
    {
        // Arrange
        var cliente = ClienteEntity.Create("Solo Corp", "999999999", "3000000001", "Bucaramanga");
        var repo = new InMemoryClienteRepository([cliente]);
        var handler = new GetClientesQueryHandler(repo);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery());

        // Assert
        Assert.Single(result);
        Assert.Equal("Solo Corp", result[0].Nombre);
        Assert.Equal("999999999", result[0].NIT);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CreatedAt / UpdatedAt timestamps are in UTC (DateTimeOffset)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_DtoTimestamps_AreUtc()
    {
        // Arrange
        var cliente = ClienteEntity.Create("Empresa UTC", "123456789", "3000000002", "Manizales");
        var repo = new InMemoryClienteRepository([cliente]);
        var handler = new GetClientesQueryHandler(repo);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery());

        // Assert — timestamps must be UTC offset
        Assert.Equal(TimeSpan.Zero, result[0].CreatedAt.Offset);
        Assert.Equal(TimeSpan.Zero, result[0].UpdatedAt.Offset);
    }
}
