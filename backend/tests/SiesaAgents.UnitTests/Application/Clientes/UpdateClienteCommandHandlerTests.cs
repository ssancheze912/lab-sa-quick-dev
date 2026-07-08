using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Exceptions;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Story 2.4 — ATDD (RED phase).
///
/// Application-layer contract tests for the <c>UpdateClienteCommandHandler</c>
/// (Task 3). Covers:
///   * AC #9  — Happy path updates the entity, calls <c>UpdateAsync</c> exactly
///              once and returns a fully-populated <see cref="ClienteDto"/>.
///   * AC #11 — Returns null when the row does not exist (short-circuit — no
///              NitExistsForAnotherAsync, no UpdateAsync). Endpoint maps to 404.
///   * AC #12 — When the NIT collides with a DIFFERENT row the handler throws
///              <c>ClienteNitConflictException</c> BEFORE calling
///              <c>UpdateAsync</c> (defence-in-depth per R-002).
///   * AC #6  — Same-NIT round-trip: the exclude-self check lets an unchanged
///              NIT through (the "cannot save because you didn't change NIT"
///              regression guard).
///   * AC #9  — R-006 mapping seam anchor: the entity's post-mutation fields
///              equal the request values verbatim.
///
/// All tests use a hand-rolled <see cref="FakeClienteRepository"/> — no mocking
/// library — per the Story 2.1/2.2/2.3 Testing Standards. Raw <c>Assert.*</c>
/// only (company convention — no FluentAssertions).
///
/// RED until the following symbols exist:
///   - SiesaAgents.Application.Clientes.Commands.UpdateClienteCommand
///   - SiesaAgents.Application.Clientes.Commands.UpdateClienteCommandHandler
///   - SiesaAgents.Application.Clientes.DTOs.UpdateClienteRequest
///   - IClienteRepository.UpdateAsync / NitExistsForAnotherAsync
///   - ClienteEntity.Update(...) mutation method
/// </summary>
public sealed class UpdateClienteCommandHandlerTests
{
    // AC #9 — Happy path. Row exists, NitExistsForAnotherAsync=false →
    // UpdateAsync called once → DTO returned with fresh UpdatedAt and
    // preserved CreatedAt.
    [Fact]
    public async Task HandleAsync_UpdatesEntity_AndReturnsDto_WhenIdExists_AndNitIsUniqueOrSelf()
    {
        var seeded = ClienteEntity.Create("Old Name", "900111000", "3000000000", "Bogotá");
        var seededCreatedAt = seeded.CreatedAt;
        var repo = new FakeClienteRepository();
        repo.SeedEntity(seeded);
        var handler = new UpdateClienteCommandHandler(repo);

        var request = new UpdateClienteRequest("New Name", "900111000", "3009998877", "Cali");
        var command = new UpdateClienteCommand(seeded.Id, request);

        // Sleep 1ms so UpdatedAt is strictly greater than CreatedAt.
        await Task.Delay(1);

        var dto = await handler.HandleAsync(command, CancellationToken.None);

        Assert.NotNull(dto);
        Assert.Equal(seeded.Id, dto!.Id);
        Assert.Equal("New Name", dto.Nombre);
        Assert.Equal("900111000", dto.Nit);
        Assert.Equal("3009998877", dto.Telefono);
        Assert.Equal("Cali", dto.Ciudad);
        // Audit-trail immutability (AC #9): CreatedAt is unchanged.
        Assert.Equal(seededCreatedAt, dto.CreatedAt);
        // UpdatedAt is refreshed and strictly greater than CreatedAt.
        Assert.True(dto.UpdatedAt > dto.CreatedAt);
        Assert.Equal(1, repo.UpdateAsyncCalls);
        Assert.Equal(1, repo.NitExistsForAnotherAsyncCalls);
        // Identity check — same entity reference is passed to UpdateAsync.
        Assert.Same(seeded, repo.LastUpdatedEntity);
    }

    // AC #11 — Row does not exist. Handler returns null WITHOUT calling
    // NitExistsForAnotherAsync or UpdateAsync (short-circuit).
    [Fact]
    public async Task HandleAsync_ReturnsNull_WhenIdDoesNotExist()
    {
        var repo = new FakeClienteRepository();
        var handler = new UpdateClienteCommandHandler(repo);

        var request = new UpdateClienteRequest("Any", "900111000", "3000000000", "Cali");
        var command = new UpdateClienteCommand(Guid.NewGuid(), request);

        var dto = await handler.HandleAsync(command, CancellationToken.None);

        Assert.Null(dto);
        Assert.Equal(0, repo.UpdateAsyncCalls);
        Assert.Equal(0, repo.NitExistsForAnotherAsyncCalls);
    }

    // AC #12 — NIT collides with a DIFFERENT row.
    // NitExistsForAnotherAsync=true → ClienteNitConflictException thrown →
    // UpdateAsync NEVER called.
    [Fact]
    public async Task HandleAsync_ThrowsClienteNitConflictException_WhenNitCollidesWithAnotherRow()
    {
        var seeded = ClienteEntity.Create("Existing", "900111000", "3000000000", "Bogotá");
        var repo = new FakeClienteRepository();
        repo.SeedEntity(seeded);
        // Mark another NIT as belonging to a DIFFERENT row.
        repo.SeedNitOnAnotherRow("800000000");
        var handler = new UpdateClienteCommandHandler(repo);

        var request = new UpdateClienteRequest("Existing", "800000000", "3000000000", "Bogotá");
        var command = new UpdateClienteCommand(seeded.Id, request);

        var ex = await Assert.ThrowsAsync<ClienteNitConflictException>(
            () => handler.HandleAsync(command, CancellationToken.None));

        Assert.Equal("800000000", ex.Nit);
        Assert.Equal(0, repo.UpdateAsyncCalls);
    }

    // AC #6 — Same-NIT round trip. The exclude-self check MUST let the
    // request through even though a row with that NIT exists — because the row
    // IS the entity being updated.
    [Fact]
    public async Task HandleAsync_AllowsSameNit_WhenItBelongsToTheSameRow()
    {
        var seeded = ClienteEntity.Create("Existing", "900111000", "3000000000", "Bogotá");
        var repo = new FakeClienteRepository();
        repo.SeedEntity(seeded);
        var handler = new UpdateClienteCommandHandler(repo);

        // Same NIT as the seeded row → NitExistsForAnotherAsync(id, "900111000")
        // returns false because the exclude-self clause hides the current row.
        var request = new UpdateClienteRequest("New Name", "900111000", "3009998877", "Cali");
        var command = new UpdateClienteCommand(seeded.Id, request);

        var dto = await handler.HandleAsync(command, CancellationToken.None);

        Assert.NotNull(dto);
        Assert.Equal("900111000", dto!.Nit);
        Assert.Equal("New Name", dto.Nombre);
        Assert.Equal(1, repo.UpdateAsyncCalls);
    }

    // AC #9 — R-006 mapping seam anchor. The request field values are
    // forwarded verbatim to the entity's post-mutation state.
    [Fact]
    public async Task HandleAsync_PassesRequestValues_ToEntityMutator()
    {
        var seeded = ClienteEntity.Create("Old", "900111000", "3000000000", "Bogotá");
        var repo = new FakeClienteRepository();
        repo.SeedEntity(seeded);
        var handler = new UpdateClienteCommandHandler(repo);

        var request = new UpdateClienteRequest("Empresa Uno", "999888777", "3009998877", "Medellín");
        var command = new UpdateClienteCommand(seeded.Id, request);

        await handler.HandleAsync(command, CancellationToken.None);

        Assert.NotNull(repo.LastUpdatedEntity);
        Assert.Equal("Empresa Uno", repo.LastUpdatedEntity!.Nombre);
        Assert.Equal("999888777", repo.LastUpdatedEntity.Nit);
        Assert.Equal("3009998877", repo.LastUpdatedEntity.Telefono);
        Assert.Equal("Medellín", repo.LastUpdatedEntity.Ciudad);
    }

    // ─── helpers ─────────────────────────────────────────────────────────

    private sealed class FakeClienteRepository : IClienteRepository
    {
        private readonly List<ClienteEntity> _items = new();
        private readonly HashSet<string> _nitsOnOtherRows = new(StringComparer.Ordinal);

        public int UpdateAsyncCalls { get; private set; }
        public int NitExistsForAnotherAsyncCalls { get; private set; }
        public ClienteEntity? LastUpdatedEntity { get; private set; }

        public void SeedEntity(ClienteEntity entity) => _items.Add(entity);
        public void SeedNitOnAnotherRow(string nit) => _nitsOnOtherRows.Add(nit);

        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult<IReadOnlyList<ClienteEntity>>(_items);

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromResult(_items.FirstOrDefault(e => e.Id == id));

        public Task AddAsync(ClienteEntity cliente, CancellationToken ct)
        {
            _items.Add(cliente);
            return Task.CompletedTask;
        }

        public Task<bool> NitExistsAsync(string nit, CancellationToken ct)
            => Task.FromResult(_items.Any(e => e.Nit == nit));

        public Task UpdateAsync(ClienteEntity cliente, CancellationToken ct)
        {
            UpdateAsyncCalls += 1;
            LastUpdatedEntity = cliente;
            return Task.CompletedTask;
        }

        public Task<bool> NitExistsForAnotherAsync(Guid id, string nit, CancellationToken ct)
        {
            NitExistsForAnotherAsyncCalls += 1;
            // Exclude-self semantics: NIT collides only if it belongs to a
            // row whose id differs from the current one.
            if (_nitsOnOtherRows.Contains(nit)) return Task.FromResult(true);
            var other = _items.FirstOrDefault(e => e.Nit == nit && e.Id != id);
            return Task.FromResult(other is not null);
        }
    }
}
