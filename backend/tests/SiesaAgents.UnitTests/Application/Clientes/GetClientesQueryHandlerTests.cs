// ─────────────────────────────────────────────────────────────────────────────
// ATDD — Story 2.1: Client List & Search
// Test Level: Unit (xUnit + EF Core InMemory)
// Phase: RED — fails until GetClientesQueryHandler, ClienteDto, and
//              IClienteRepository implementations exist
//
// Acceptance Criteria covered:
//   AC1 — GET /api/v1/clientes returns array of ClienteDto (Nombre + NIT/RUC visible)
//   AC4 — Returns empty list when no clients exist (not null, not exception)
//
// Pattern: Arrange / Act / Assert  (AAA)
// ─────────────────────────────────────────────────────────────────────────────

using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Interfaces;
using Xunit;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Unit tests for GetClientesQueryHandler.
/// The repository is mocked via a simple in-memory stub — no EF Core, no Postgres.
/// </summary>
public class GetClientesQueryHandlerTests
{
    // ──────────────────────────────────────────────────────────────────────────
    // Stub repository
    // ──────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Minimal in-memory stub for IClienteRepository.
    /// Returns whatever list is provided at construction time.
    /// </summary>
    private sealed class StubClienteRepository : IClienteRepository
    {
        private readonly IEnumerable<SiesaAgents.Domain.Clientes.Entities.ClienteEntity> _data;

        public StubClienteRepository(IEnumerable<SiesaAgents.Domain.Clientes.Entities.ClienteEntity> data)
            => _data = data;

        public Task<IEnumerable<SiesaAgents.Domain.Clientes.Entities.ClienteEntity>> GetAllAsync(
            CancellationToken ct = default)
            => Task.FromResult(_data);

        // Other IClienteRepository members — not exercised in Story 2.1
        public Task<SiesaAgents.Domain.Clientes.Entities.ClienteEntity?> GetByIdAsync(
            Guid id, CancellationToken ct = default)
            => Task.FromResult<SiesaAgents.Domain.Clientes.Entities.ClienteEntity?>(null);

        public Task<SiesaAgents.Domain.Clientes.Entities.ClienteEntity?> GetByNitAsync(
            string nit, CancellationToken ct = default)
            => Task.FromResult<SiesaAgents.Domain.Clientes.Entities.ClienteEntity?>(null);

        public Task AddAsync(
            SiesaAgents.Domain.Clientes.Entities.ClienteEntity entity,
            CancellationToken ct = default)
            => Task.CompletedTask;

        public Task UpdateAsync(
            SiesaAgents.Domain.Clientes.Entities.ClienteEntity entity,
            CancellationToken ct = default)
            => Task.CompletedTask;

        public Task DeleteAsync(
            SiesaAgents.Domain.Clientes.Entities.ClienteEntity entity,
            CancellationToken ct = default)
            => Task.CompletedTask;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Helper factory
    // ──────────────────────────────────────────────────────────────────────────

    private static SiesaAgents.Domain.Clientes.Entities.ClienteEntity MakeCliente(
        string nombre = "Construcciones del Valle",
        string nit = "900123456-1",
        string telefono = "+57 2 123 4567",
        string ciudad = "Cali")
        => SiesaAgents.Domain.Clientes.Entities.ClienteEntity.Create(nombre, nit, telefono, ciudad);

    // ──────────────────────────────────────────────────────────────────────────
    // AC4 — Empty list when no records exist
    // ──────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "AC4 — Handle returns empty enumerable when repository has no records")]
    public async Task Handle_NoClientes_ReturnsEmptyEnumerable()
    {
        // ARRANGE: Repository with zero records
        var repository = new StubClienteRepository(Enumerable.Empty<SiesaAgents.Domain.Clientes.Entities.ClienteEntity>());
        var handler = new GetClientesQueryHandler(repository);
        var query = new GetClientesQuery();

        // ACT
        var result = await handler.Handle(query, CancellationToken.None);

        // ASSERT: Result is an empty enumerable — never null
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // AC1 — Returns IEnumerable<ClienteDto> with correct field mapping
    // ──────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "AC1 — Handle returns one ClienteDto per entity in repository")]
    public async Task Handle_OneCliente_ReturnsOneClienteDto()
    {
        // ARRANGE: Repository with a single client
        var entity = MakeCliente();
        var repository = new StubClienteRepository(new[] { entity });
        var handler = new GetClientesQueryHandler(repository);
        var query = new GetClientesQuery();

        // ACT
        var result = await handler.Handle(query, CancellationToken.None);

        // ASSERT: One DTO returned
        var list = result.ToList();
        Assert.Single(list);
    }

    [Fact(DisplayName = "AC1 — ClienteDto.Nombre matches ClienteEntity.Nombre")]
    public async Task Handle_OneCliente_DtoNombreMatchesEntity()
    {
        // ARRANGE
        var entity = MakeCliente(nombre: "Inversiones Andinas");
        var repository = new StubClienteRepository(new[] { entity });
        var handler = new GetClientesQueryHandler(repository);

        // ACT
        var result = await handler.Handle(new GetClientesQuery(), CancellationToken.None);
        var dto = result.Single();

        // ASSERT
        Assert.Equal("Inversiones Andinas", dto.Nombre);
    }

    [Fact(DisplayName = "AC1 — ClienteDto.Nit matches ClienteEntity.Nit")]
    public async Task Handle_OneCliente_DtoNitMatchesEntity()
    {
        // ARRANGE
        var entity = MakeCliente(nit: "800987654-2");
        var repository = new StubClienteRepository(new[] { entity });
        var handler = new GetClientesQueryHandler(repository);

        // ACT
        var result = await handler.Handle(new GetClientesQuery(), CancellationToken.None);
        var dto = result.Single();

        // ASSERT
        Assert.Equal("800987654-2", dto.Nit);
    }

    [Fact(DisplayName = "AC1 — ClienteDto.Telefono matches ClienteEntity.Telefono")]
    public async Task Handle_OneCliente_DtoTelefonoMatchesEntity()
    {
        // ARRANGE
        var entity = MakeCliente(telefono: "+57 300 000 0000");
        var repository = new StubClienteRepository(new[] { entity });
        var handler = new GetClientesQueryHandler(repository);

        // ACT
        var result = await handler.Handle(new GetClientesQuery(), CancellationToken.None);
        var dto = result.Single();

        // ASSERT
        Assert.Equal("+57 300 000 0000", dto.Telefono);
    }

    [Fact(DisplayName = "AC1 — ClienteDto.Ciudad matches ClienteEntity.Ciudad")]
    public async Task Handle_OneCliente_DtoCiudadMatchesEntity()
    {
        // ARRANGE
        var entity = MakeCliente(ciudad: "Medellín");
        var repository = new StubClienteRepository(new[] { entity });
        var handler = new GetClientesQueryHandler(repository);

        // ACT
        var result = await handler.Handle(new GetClientesQuery(), CancellationToken.None);
        var dto = result.Single();

        // ASSERT
        Assert.Equal("Medellín", dto.Ciudad);
    }

    [Fact(DisplayName = "AC1 — ClienteDto.Id is a non-empty Guid")]
    public async Task Handle_OneCliente_DtoIdIsNonEmptyGuid()
    {
        // ARRANGE
        var entity = MakeCliente();
        var repository = new StubClienteRepository(new[] { entity });
        var handler = new GetClientesQueryHandler(repository);

        // ACT
        var result = await handler.Handle(new GetClientesQuery(), CancellationToken.None);
        var dto = result.Single();

        // ASSERT: ID is a valid non-empty Guid
        Assert.NotEqual(Guid.Empty, dto.Id);
    }

    [Fact(DisplayName = "AC1 — Handle returns correct count when repository has multiple clients")]
    public async Task Handle_MultipleClientes_ReturnsCorrectCount()
    {
        // ARRANGE: Three distinct clients
        var entities = new[]
        {
            MakeCliente("Cliente A", "111111111-1"),
            MakeCliente("Cliente B", "222222222-2"),
            MakeCliente("Cliente C", "333333333-3"),
        };
        var repository = new StubClienteRepository(entities);
        var handler = new GetClientesQueryHandler(repository);

        // ACT
        var result = await handler.Handle(new GetClientesQuery(), CancellationToken.None);

        // ASSERT: All three entities are returned as DTOs
        Assert.Equal(3, result.Count());
    }

    [Fact(DisplayName = "AC1 — ClienteDto.CreatedAt is DateTimeOffset (never default)")]
    public async Task Handle_OneCliente_DtoCreatedAtIsDateTimeOffset()
    {
        // ARRANGE
        var entity = MakeCliente();
        var repository = new StubClienteRepository(new[] { entity });
        var handler = new GetClientesQueryHandler(repository);

        // ACT
        var result = await handler.Handle(new GetClientesQuery(), CancellationToken.None);
        var dto = result.Single();

        // ASSERT: CreatedAt is not the default uninitialized DateTimeOffset
        Assert.NotEqual(default(DateTimeOffset), dto.CreatedAt);
    }

    [Fact(DisplayName = "AC1 — Handler respects CancellationToken (non-cancelled token does not throw)")]
    public async Task Handle_WithNonCancelledToken_DoesNotThrow()
    {
        // ARRANGE
        var repository = new StubClienteRepository(new[] { MakeCliente() });
        var handler = new GetClientesQueryHandler(repository);
        using var cts = new CancellationTokenSource();

        // ACT + ASSERT: No exception with a live (non-cancelled) token
        var exception = await Record.ExceptionAsync(
            () => handler.Handle(new GetClientesQuery(), cts.Token));
        Assert.Null(exception);
    }

    [Fact(DisplayName = "AC4 — Handle result type is IEnumerable<ClienteDto> (never a wrapper object)")]
    public async Task Handle_ResultType_IsEnumerableOfClienteDto()
    {
        // ARRANGE: Architecture mandates a direct array — no pagination wrapper
        var repository = new StubClienteRepository(new[] { MakeCliente() });
        var handler = new GetClientesQueryHandler(repository);

        // ACT
        var result = await handler.Handle(new GetClientesQuery(), CancellationToken.None);

        // ASSERT: Result is assignable to IEnumerable<ClienteDto>
        Assert.IsAssignableFrom<IEnumerable<ClienteDto>>(result);
    }
}
