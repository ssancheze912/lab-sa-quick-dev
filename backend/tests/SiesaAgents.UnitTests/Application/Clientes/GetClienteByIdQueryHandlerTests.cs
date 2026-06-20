// ─────────────────────────────────────────────────────────────────────────────
// ATDD — Story 2.2: Client Detail View
// Test Level: Unit (xUnit)
// Phase: RED — fails until GetClienteByIdQueryHandler, GetClienteByIdQuery,
//              and IClienteRepository.GetByIdAsync exist
//
// Acceptance Criteria covered:
//   AC2 — GET /api/v1/clientes/:id returns ClienteDto with Nombre, NIT, Teléfono, Ciudad
//   AC3 — Returns 404-mapped NotFoundException when clienteId does not exist
//   AC4 — Handler propagates errors correctly (exception, not silent failure)
//
// Pattern: Arrange / Act / Assert (AAA)
// ─────────────────────────────────────────────────────────────────────────────

using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Interfaces;
using Xunit;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Unit tests for GetClienteByIdQueryHandler.
/// Repository is mocked via an in-memory stub — no EF Core, no Postgres.
/// </summary>
public class GetClienteByIdQueryHandlerTests
{
    // ──────────────────────────────────────────────────────────────────────────
    // Stub repository
    // ──────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// In-memory stub for IClienteRepository.
    /// GetByIdAsync returns the entity if its Id matches, otherwise null.
    /// </summary>
    private sealed class StubClienteRepository : IClienteRepository
    {
        private readonly IEnumerable<SiesaAgents.Domain.Clientes.Entities.ClienteEntity> _data;

        public StubClienteRepository(
            IEnumerable<SiesaAgents.Domain.Clientes.Entities.ClienteEntity> data)
            => _data = data;

        public Task<IEnumerable<SiesaAgents.Domain.Clientes.Entities.ClienteEntity>> GetAllAsync(
            CancellationToken ct = default)
            => Task.FromResult(_data);

        public Task<SiesaAgents.Domain.Clientes.Entities.ClienteEntity?> GetByIdAsync(
            Guid id, CancellationToken ct = default)
        {
            var entity = _data.FirstOrDefault(e => e.Id == id);
            return Task.FromResult<SiesaAgents.Domain.Clientes.Entities.ClienteEntity?>(entity);
        }

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
    // AC2 — Returns ClienteDto when client exists
    // ──────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "AC2 — Handle returns ClienteDto when client with given Id exists")]
    public async Task Handle_ExistingId_ReturnsClienteDto()
    {
        // ARRANGE: Repository contains the client we will request
        var entity = MakeCliente();
        var repository = new StubClienteRepository(new[] { entity });
        var handler = new GetClienteByIdQueryHandler(repository);
        var query = new GetClienteByIdQuery(entity.Id);

        // ACT
        var result = await handler.Handle(query, CancellationToken.None);

        // ASSERT: Result is a non-null ClienteDto
        Assert.NotNull(result);
        Assert.IsType<ClienteDto>(result);
    }

    [Fact(DisplayName = "AC2 — ClienteDto.Id matches the requested Id")]
    public async Task Handle_ExistingId_DtoIdMatchesRequestedId()
    {
        // ARRANGE
        var entity = MakeCliente();
        var repository = new StubClienteRepository(new[] { entity });
        var handler = new GetClienteByIdQueryHandler(repository);

        // ACT
        var result = await handler.Handle(new GetClienteByIdQuery(entity.Id), CancellationToken.None);

        // ASSERT
        Assert.Equal(entity.Id, result.Id);
    }

    [Fact(DisplayName = "AC2 — ClienteDto.Nombre matches ClienteEntity.Nombre")]
    public async Task Handle_ExistingId_DtoNombreMatchesEntity()
    {
        // ARRANGE
        var entity = MakeCliente(nombre: "Inversiones Andinas");
        var repository = new StubClienteRepository(new[] { entity });
        var handler = new GetClienteByIdQueryHandler(repository);

        // ACT
        var result = await handler.Handle(new GetClienteByIdQuery(entity.Id), CancellationToken.None);

        // ASSERT
        Assert.Equal("Inversiones Andinas", result.Nombre);
    }

    [Fact(DisplayName = "AC2 — ClienteDto.Nit matches ClienteEntity.Nit")]
    public async Task Handle_ExistingId_DtoNitMatchesEntity()
    {
        // ARRANGE
        var entity = MakeCliente(nit: "800987654-2");
        var repository = new StubClienteRepository(new[] { entity });
        var handler = new GetClienteByIdQueryHandler(repository);

        // ACT
        var result = await handler.Handle(new GetClienteByIdQuery(entity.Id), CancellationToken.None);

        // ASSERT
        Assert.Equal("800987654-2", result.Nit);
    }

    [Fact(DisplayName = "AC2 — ClienteDto.Telefono matches ClienteEntity.Telefono")]
    public async Task Handle_ExistingId_DtoTelefonoMatchesEntity()
    {
        // ARRANGE
        var entity = MakeCliente(telefono: "+57 300 000 0000");
        var repository = new StubClienteRepository(new[] { entity });
        var handler = new GetClienteByIdQueryHandler(repository);

        // ACT
        var result = await handler.Handle(new GetClienteByIdQuery(entity.Id), CancellationToken.None);

        // ASSERT
        Assert.Equal("+57 300 000 0000", result.Telefono);
    }

    [Fact(DisplayName = "AC2 — ClienteDto.Ciudad matches ClienteEntity.Ciudad")]
    public async Task Handle_ExistingId_DtoCiudadMatchesEntity()
    {
        // ARRANGE
        var entity = MakeCliente(ciudad: "Medellín");
        var repository = new StubClienteRepository(new[] { entity });
        var handler = new GetClienteByIdQueryHandler(repository);

        // ACT
        var result = await handler.Handle(new GetClienteByIdQuery(entity.Id), CancellationToken.None);

        // ASSERT
        Assert.Equal("Medellín", result.Ciudad);
    }

    [Fact(DisplayName = "AC2 — ClienteDto.CreatedAt is DateTimeOffset (never default)")]
    public async Task Handle_ExistingId_DtoCreatedAtIsDateTimeOffset()
    {
        // ARRANGE
        var entity = MakeCliente();
        var repository = new StubClienteRepository(new[] { entity });
        var handler = new GetClienteByIdQueryHandler(repository);

        // ACT
        var result = await handler.Handle(new GetClienteByIdQuery(entity.Id), CancellationToken.None);

        // ASSERT: CreatedAt is not the uninitialized DateTimeOffset default
        Assert.NotEqual(default(DateTimeOffset), result.CreatedAt);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // AC3 — Throws NotFoundException when clienteId does not exist
    // ──────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "AC3 — Handle throws NotFoundException when Id does not exist in repository")]
    public async Task Handle_NonExistentId_ThrowsNotFoundException()
    {
        // ARRANGE: Repository is empty — the requested Id will never match
        var repository = new StubClienteRepository(
            Enumerable.Empty<SiesaAgents.Domain.Clientes.Entities.ClienteEntity>());
        var handler = new GetClienteByIdQueryHandler(repository);
        var nonExistentId = Guid.NewGuid();
        var query = new GetClienteByIdQuery(nonExistentId);

        // ACT + ASSERT: NotFoundException is thrown (maps to 404 via ExceptionHandlingMiddleware)
        await Assert.ThrowsAsync<SiesaAgents.Application.Common.Exceptions.NotFoundException>(
            () => handler.Handle(query, CancellationToken.None));
    }

    [Fact(DisplayName = "AC3 — NotFoundException message mentions the non-existent clienteId")]
    public async Task Handle_NonExistentId_ExceptionMessageContainsId()
    {
        // ARRANGE
        var repository = new StubClienteRepository(
            Enumerable.Empty<SiesaAgents.Domain.Clientes.Entities.ClienteEntity>());
        var handler = new GetClienteByIdQueryHandler(repository);
        var nonExistentId = Guid.NewGuid();

        // ACT
        var exception = await Assert.ThrowsAsync<SiesaAgents.Application.Common.Exceptions.NotFoundException>(
            () => handler.Handle(new GetClienteByIdQuery(nonExistentId), CancellationToken.None));

        // ASSERT: Error message contains the Id so the middleware can build a useful Problem Details response
        Assert.Contains(nonExistentId.ToString(), exception.Message);
    }

    [Fact(DisplayName = "AC3 — Handle does NOT return null when client is not found (throws instead)")]
    public async Task Handle_NonExistentId_DoesNotReturnNull()
    {
        // ARRANGE: Repository returns null from GetByIdAsync
        var repository = new StubClienteRepository(
            Enumerable.Empty<SiesaAgents.Domain.Clientes.Entities.ClienteEntity>());
        var handler = new GetClienteByIdQueryHandler(repository);

        // ACT + ASSERT: Handler must throw, not silently return null
        // (null returns would bypass the ExceptionHandlingMiddleware 404 mapping)
        await Assert.ThrowsAnyAsync<Exception>(
            () => handler.Handle(new GetClienteByIdQuery(Guid.NewGuid()), CancellationToken.None));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Cancellation token respect
    // ──────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "AC2 — Handler respects CancellationToken (non-cancelled token does not throw)")]
    public async Task Handle_WithNonCancelledToken_DoesNotThrow()
    {
        // ARRANGE
        var entity = MakeCliente();
        var repository = new StubClienteRepository(new[] { entity });
        var handler = new GetClienteByIdQueryHandler(repository);
        using var cts = new CancellationTokenSource();

        // ACT + ASSERT: No exception with a live (non-cancelled) token
        var exception = await Record.ExceptionAsync(
            () => handler.Handle(new GetClienteByIdQuery(entity.Id), cts.Token));
        Assert.Null(exception);
    }
}
