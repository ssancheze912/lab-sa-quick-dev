// ─────────────────────────────────────────────────────────────────────────────
// ATDD — Story 2.3: Create Client
// Test Level: Unit (xUnit)
// Phase: GREEN — tests pass with CreateClienteCommandHandler implementation
//
// Acceptance Criteria covered:
//   AC2 — POST /api/v1/clientes creates a new client and returns ClienteDto
//   AC4 — POST /api/v1/clientes with duplicate NIT throws ConflictException
//
// Pattern: Arrange / Act / Assert (AAA)
// ─────────────────────────────────────────────────────────────────────────────

using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Common.Exceptions;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using Xunit;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Unit tests for CreateClienteCommandHandler.
/// Repository is mocked via an in-memory stub — no EF Core, no Postgres.
/// </summary>
public class CreateClienteCommandHandlerTests
{
    // ──────────────────────────────────────────────────────────────────────────
    // Stub repository
    // ──────────────────────────────────────────────────────────────────────────

    private sealed class StubClienteRepository : IClienteRepository
    {
        private readonly List<ClienteEntity> _store;

        public StubClienteRepository(IEnumerable<ClienteEntity>? seed = null)
            => _store = seed?.ToList() ?? [];

        public Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct = default)
            => Task.FromResult<IEnumerable<ClienteEntity>>(_store);

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct = default)
            => Task.FromResult<ClienteEntity?>(_store.FirstOrDefault(e => e.Id == id));

        public Task<ClienteEntity?> GetByNitAsync(string nit, CancellationToken ct = default)
            => Task.FromResult<ClienteEntity?>(_store.FirstOrDefault(e => e.Nit == nit));

        public Task AddAsync(ClienteEntity entity, CancellationToken ct = default)
        {
            _store.Add(entity);
            return Task.CompletedTask;
        }

        public Task UpdateAsync(ClienteEntity entity, CancellationToken ct = default)
            => Task.CompletedTask;

        public Task DeleteAsync(ClienteEntity entity, CancellationToken ct = default)
            => Task.CompletedTask;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // AC2 — Creates client and returns ClienteDto when NIT is unique
    // ──────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "AC2 — Handle creates client and returns ClienteDto when NIT is unique")]
    public async Task Handle_UniqueNit_CreatesClientAndReturnsDto()
    {
        // ARRANGE: Empty repository
        var repository = new StubClienteRepository();
        var handler = new CreateClienteCommandHandler(repository);
        var command = new CreateClienteCommand("Empresa Test", "900111222-1", "3001234567", "Bogotá");

        // ACT
        var result = await handler.Handle(command, CancellationToken.None);

        // ASSERT: Returns a ClienteDto with correct field values
        Assert.NotNull(result);
        Assert.IsType<ClienteDto>(result);
        Assert.Equal("Empresa Test", result.Nombre);
        Assert.Equal("900111222-1", result.Nit);
        Assert.Equal("3001234567", result.Telefono);
        Assert.Equal("Bogotá", result.Ciudad);
    }

    [Fact(DisplayName = "AC2 — Handle returns ClienteDto with non-empty Guid Id")]
    public async Task Handle_UniqueNit_ReturnsDtoWithNonEmptyId()
    {
        // ARRANGE
        var repository = new StubClienteRepository();
        var handler = new CreateClienteCommandHandler(repository);
        var command = new CreateClienteCommand("Corp A", "800000001-1", "6017654321", "Cali");

        // ACT
        var result = await handler.Handle(command, CancellationToken.None);

        // ASSERT: Id is a valid non-empty Guid
        Assert.NotEqual(Guid.Empty, result.Id);
    }

    [Fact(DisplayName = "AC2 — Handle returns ClienteDto with DateTimeOffset CreatedAt")]
    public async Task Handle_UniqueNit_ReturnsDtoWithValidCreatedAt()
    {
        // ARRANGE
        var repository = new StubClienteRepository();
        var handler = new CreateClienteCommandHandler(repository);
        var command = new CreateClienteCommand("Corp B", "800000002-2", "3209876543", "Medellín");

        // ACT
        var result = await handler.Handle(command, CancellationToken.None);

        // ASSERT: CreatedAt is not the default uninitialized DateTimeOffset
        Assert.NotEqual(default(DateTimeOffset), result.CreatedAt);
    }

    [Fact(DisplayName = "AC2 — Handle adds entity to repository (store contains new entity)")]
    public async Task Handle_UniqueNit_AddsEntityToRepository()
    {
        // ARRANGE
        var repository = new StubClienteRepository();
        var handler = new CreateClienteCommandHandler(repository);
        var command = new CreateClienteCommand("Corp C", "900000003-3", "6014321567", "Barranquilla");

        // ACT
        await handler.Handle(command, CancellationToken.None);

        // ASSERT: The entity is now in the repository
        var stored = await repository.GetByNitAsync("900000003-3");
        Assert.NotNull(stored);
        Assert.Equal("Corp C", stored.Nombre);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // AC4 — Throws ConflictException when NIT already exists
    // ──────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "AC4 — Handle throws ConflictException when NIT already exists in repository")]
    public async Task Handle_DuplicateNit_ThrowsConflictException()
    {
        // ARRANGE: Repository seeded with an existing entity having the same NIT
        var existing = ClienteEntity.Create("Empresa Existente", "900111222-1", "3001234567", "Bogotá");
        var repository = new StubClienteRepository(new[] { existing });
        var handler = new CreateClienteCommandHandler(repository);
        var command = new CreateClienteCommand("Nueva Empresa", "900111222-1", "3009876543", "Cali");

        // ACT + ASSERT: ConflictException is thrown
        await Assert.ThrowsAsync<ConflictException>(
            () => handler.Handle(command, CancellationToken.None));
    }

    [Fact(DisplayName = "AC4 — ConflictException message contains the duplicate NIT value")]
    public async Task Handle_DuplicateNit_ExceptionMessageContainsNit()
    {
        // ARRANGE
        var existing = ClienteEntity.Create("Empresa X", "800777888-5", "3001111111", "Cali");
        var repository = new StubClienteRepository(new[] { existing });
        var handler = new CreateClienteCommandHandler(repository);
        var command = new CreateClienteCommand("Empresa Y", "800777888-5", "3002222222", "Bogotá");

        // ACT
        var exception = await Record.ExceptionAsync(
            () => handler.Handle(command, CancellationToken.None));

        // ASSERT: Exception is ConflictException with NIT in message
        Assert.IsType<ConflictException>(exception);
        Assert.Contains("800777888-5", exception!.Message);
    }

    [Fact(DisplayName = "AC4 — Handle does NOT add entity to repository when NIT is duplicate")]
    public async Task Handle_DuplicateNit_DoesNotAddEntityToRepository()
    {
        // ARRANGE
        var existing = ClienteEntity.Create("Original", "111222333-4", "3001234567", "Bogotá");
        var repository = new StubClienteRepository(new[] { existing });
        var handler = new CreateClienteCommandHandler(repository);
        var command = new CreateClienteCommand("Duplicate", "111222333-4", "3009876543", "Medellín");
        var beforeCount = (await repository.GetAllAsync()).Count();

        // ACT: Catch the expected exception
        await Record.ExceptionAsync(() => handler.Handle(command, CancellationToken.None));

        // ASSERT: Repository still has only the original entity
        var afterCount = (await repository.GetAllAsync()).Count();
        Assert.Equal(beforeCount, afterCount);
    }
}
