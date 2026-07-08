using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Exceptions;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Story 2.3 — ATDD (RED phase).
///
/// Application-layer contract tests for the <c>CreateClienteCommandHandler</c>
/// (Task 3). Covers:
///   * AC #9  — Happy path creates the entity, calls <c>AddAsync</c> exactly
///              once and returns a fully-populated <see cref="ClienteDto"/>.
///   * AC #11 — When the NIT already exists the handler throws
///              <c>ClienteNitConflictException</c> BEFORE calling
///              <c>AddAsync</c> (defence-in-depth per R-002).
///   * AC #9  — The handler forwards the request field values verbatim to the
///              entity factory (R-006 mapping seam anchor).
///
/// All tests use a hand-rolled <see cref="FakeClienteRepository"/> — no mocking
/// library — per the Story 2.1/2.2 Testing Standards.
///
/// RED until the following symbols exist:
///   - SiesaAgents.Application.Clientes.Commands.CreateClienteCommand
///   - SiesaAgents.Application.Clientes.Commands.CreateClienteCommandHandler
///   - SiesaAgents.Application.Clientes.DTOs.CreateClienteRequest
///   - SiesaAgents.Domain.Clientes.Exceptions.ClienteNitConflictException
///   - IClienteRepository.AddAsync / NitExistsAsync
/// </summary>
public sealed class CreateClienteCommandHandlerTests
{
    // AC #9 — Happy path. NitExistsAsync=false → AddAsync called once → DTO returned.
    [Fact]
    public async Task HandleAsync_CreatesEntity_AndReturnsDto_WhenNitIsUnique()
    {
        var repo = new FakeClienteRepository();
        var handler = new CreateClienteCommandHandler(repo);

        var request = new CreateClienteRequest("Acme SAS", "900123456", "3001234567", "Cali");
        var command = new CreateClienteCommand(request);

        var dto = await handler.HandleAsync(command, CancellationToken.None);

        Assert.NotNull(dto);
        Assert.NotEqual(Guid.Empty, dto!.Id);
        Assert.Equal("Acme SAS", dto.Nombre);
        Assert.Equal("900123456", dto.Nit);
        Assert.Equal("3001234567", dto.Telefono);
        Assert.Equal("Cali", dto.Ciudad);
        Assert.Equal(dto.CreatedAt, dto.UpdatedAt);
        Assert.Equal(1, repo.AddAsyncCalls);
        Assert.Equal(1, repo.NitExistsAsyncCalls);
    }

    // AC #11 — NIT conflict path. NitExistsAsync=true → AddAsync NEVER called → exception thrown.
    [Fact]
    public async Task HandleAsync_ThrowsClienteNitConflictException_WhenNitExists()
    {
        var repo = new FakeClienteRepository();
        repo.SeedExistingNit("900123456");
        var handler = new CreateClienteCommandHandler(repo);

        var request = new CreateClienteRequest("Acme SAS", "900123456", "3001234567", "Cali");
        var command = new CreateClienteCommand(request);

        var ex = await Assert.ThrowsAsync<ClienteNitConflictException>(
            () => handler.HandleAsync(command, CancellationToken.None));

        Assert.Equal("900123456", ex.Nit);
        Assert.Equal(0, repo.AddAsyncCalls);
        Assert.Equal(1, repo.NitExistsAsyncCalls);
    }

    // AC #9 — Request field values are forwarded verbatim to the entity factory
    // (R-006 mapping seam anchor).
    [Fact]
    public async Task HandleAsync_PassesRequestValues_ToEntityFactory()
    {
        var repo = new FakeClienteRepository();
        var handler = new CreateClienteCommandHandler(repo);

        var request = new CreateClienteRequest("Empresa Uno", "999888777", "3009998877", "Medellín");
        var command = new CreateClienteCommand(request);

        await handler.HandleAsync(command, CancellationToken.None);

        Assert.NotNull(repo.LastAddedEntity);
        Assert.Equal("Empresa Uno", repo.LastAddedEntity!.Nombre);
        Assert.Equal("999888777", repo.LastAddedEntity.Nit);
        Assert.Equal("3009998877", repo.LastAddedEntity.Telefono);
        Assert.Equal("Medellín", repo.LastAddedEntity.Ciudad);
    }

    // ─── helpers ─────────────────────────────────────────────────────────

    private sealed class FakeClienteRepository : IClienteRepository
    {
        private readonly HashSet<string> _existingNits = new(StringComparer.Ordinal);
        private readonly List<ClienteEntity> _items = new();

        public int AddAsyncCalls { get; private set; }
        public int NitExistsAsyncCalls { get; private set; }
        public ClienteEntity? LastAddedEntity { get; private set; }

        public void SeedExistingNit(string nit) => _existingNits.Add(nit);

        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult<IReadOnlyList<ClienteEntity>>(_items);

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromResult(_items.FirstOrDefault(e => e.Id == id));

        public Task AddAsync(ClienteEntity cliente, CancellationToken ct)
        {
            AddAsyncCalls += 1;
            LastAddedEntity = cliente;
            _items.Add(cliente);
            _existingNits.Add(cliente.Nit);
            return Task.CompletedTask;
        }

        public Task<bool> NitExistsAsync(string nit, CancellationToken ct)
        {
            NitExistsAsyncCalls += 1;
            return Task.FromResult(_existingNits.Contains(nit));
        }

        // Story 2.4 additions — create-flow tests do not exercise updates.
        public Task UpdateAsync(ClienteEntity cliente, CancellationToken ct) => Task.CompletedTask;
        public Task<bool> NitExistsForAnotherAsync(Guid id, string nit, CancellationToken ct) => Task.FromResult(false);
    }
}
