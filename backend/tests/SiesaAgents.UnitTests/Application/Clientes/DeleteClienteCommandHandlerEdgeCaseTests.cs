using Xunit;
using FluentValidation;
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.Validators;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Exceptions;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Edge-case tests for DeleteClienteCommandHandler and DeleteClienteCommandValidator.
///
/// Primary tests (DeleteClienteCommandHandlerTests.cs) cover:
///   - Existing client: completes without exception
///   - Existing client: DeleteAsync called with correct id
///   - Non-existent client: throws NotFoundException
///   - Non-existent client: still calls DeleteAsync
///   - Empty Guid: throws ValidationException (validator fires before repo)
///   - Existing client: removes client from repository
///
/// This file covers:
///   - Validator: Empty Guid throws FluentValidation.ValidationException (not NotFoundException)
///   - Validator: Valid Guid passes validation without exception
///   - CancellationToken is forwarded to DeleteAsync
///   - Handler with multiple clients: only the targeted client is removed
///   - Repository receiving the exact same Guid as passed in command
///   - Two sequential deletes on different clients: both succeed independently
/// </summary>
public class DeleteClienteCommandHandlerEdgeCaseTests
{
    // ─────────────────────────────────────────────────────────────────────
    // Fake repository
    // ─────────────────────────────────────────────────────────────────────

    private sealed class FakeClienteRepository : IClienteRepository
    {
        private readonly List<ClienteEntity> _clientes;
        public Guid? LastDeletedId { get; private set; }
        public CancellationToken LastCancellationToken { get; private set; }

        public FakeClienteRepository(IEnumerable<ClienteEntity>? existing = null)
        {
            _clientes = existing?.ToList() ?? [];
        }

        public Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult<IEnumerable<ClienteEntity>>(_clientes);

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromResult(_clientes.FirstOrDefault(c => c.Id == id));

        public Task<ClienteEntity> CreateAsync(ClienteEntity cliente, CancellationToken ct)
        {
            _clientes.Add(cliente);
            return Task.FromResult(cliente);
        }

        public Task UpdateAsync(ClienteEntity entity, CancellationToken ct)
            => Task.CompletedTask;

        public Task<bool> DeleteAsync(Guid id, CancellationToken ct)
        {
            LastDeletedId = id;
            LastCancellationToken = ct;
            var existing = _clientes.FirstOrDefault(c => c.Id == id);
            if (existing is null) return Task.FromResult(false);
            _clientes.Remove(existing);
            return Task.FromResult(true);
        }

        public Task<bool> ExistsByNitAsync(string nit, CancellationToken ct)
            => Task.FromResult(_clientes.Any(c => c.Nit == nit));
    }

    private static DeleteClienteCommandHandler BuildHandler(FakeClienteRepository repo)
        => new DeleteClienteCommandHandler(repo, new DeleteClienteCommandValidator());

    // ─────────────────────────────────────────────────────────────────────
    // Validator edge cases
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Validator_EmptyGuid_ThrowsValidationException()
    {
        // Arrange
        var validator = new DeleteClienteCommandValidator();
        var command = new DeleteClienteCommand(Guid.Empty);

        // Act
        var result = await validator.ValidateAsync(command);

        // Assert: Validation fails for empty Guid (not a NotFoundException — validator fires first)
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(DeleteClienteCommand.Id));
    }

    [Fact]
    public async Task Validator_ValidGuid_PassesValidation()
    {
        // Arrange
        var validator = new DeleteClienteCommandValidator();
        var command = new DeleteClienteCommand(Guid.NewGuid());

        // Act
        var result = await validator.ValidateAsync(command);

        // Assert
        Assert.True(result.IsValid);
        Assert.Empty(result.Errors);
    }

    [Fact]
    public async Task Handle_EmptyGuid_ThrowsValidationExceptionBeforeRepositoryCall()
    {
        // Arrange: empty repo — if handler reaches DeleteAsync for Guid.Empty it would return false
        var repo = new FakeClienteRepository();
        var handler = BuildHandler(repo);
        var command = new DeleteClienteCommand(Guid.Empty);

        // Act & Assert: ValidationException thrown by validator (not NotFoundException from repo)
        await Assert.ThrowsAsync<ValidationException>(
            () => handler.Handle(command, CancellationToken.None));
    }

    // ─────────────────────────────────────────────────────────────────────
    // CancellationToken forwarding
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_ExistingClient_ForwardsCancellationTokenToRepository()
    {
        // Arrange
        var existing = ClienteEntity.Create("Empresa Token", "900777000-1", "3007770001", "Bogotá");
        var repo = new FakeClienteRepository([existing]);
        var handler = BuildHandler(repo);
        var command = new DeleteClienteCommand(existing.Id);
        using var cts = new CancellationTokenSource();
        var token = cts.Token;

        // Act
        await handler.Handle(command, token);

        // Assert: the same cancellation token was forwarded to DeleteAsync
        Assert.Equal(token, repo.LastCancellationToken);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Precision — only target client removed from multi-client repository
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_ThreeClients_OnlyTargetRemovedOthersTwoRemain()
    {
        // Arrange: three clients in repository
        var c1 = ClienteEntity.Create("Empresa Uno", "900000010-1", "3000000010", "Bogotá");
        var c2 = ClienteEntity.Create("Empresa Dos", "900000020-2", "3000000020", "Medellín");
        var c3 = ClienteEntity.Create("Empresa Tres", "900000030-3", "3000000030", "Cali");
        var repo = new FakeClienteRepository([c1, c2, c3]);
        var handler = BuildHandler(repo);

        // Act: delete only c2
        await handler.Handle(new DeleteClienteCommand(c2.Id), CancellationToken.None);

        // Assert: c2 removed; c1 and c3 remain
        var remaining = (await repo.GetAllAsync(CancellationToken.None)).ToList();
        Assert.Equal(2, remaining.Count);
        Assert.DoesNotContain(remaining, c => c.Id == c2.Id);
        Assert.Contains(remaining, c => c.Id == c1.Id);
        Assert.Contains(remaining, c => c.Id == c3.Id);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Id correctness — handler passes the exact Guid from the command
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_ExistingClient_PassesExactGuidToRepository()
    {
        // Arrange
        var expected = Guid.Parse("a1b2c3d4-e5f6-7890-abcd-ef1234567890");
        var existing = ClienteEntity.Create("Empresa Guid", "900100000-1", "3001000001", "Bogotá");

        // Manually set the Id to the known Guid using reflection (test precision)
        typeof(ClienteEntity)
            .GetProperty(nameof(ClienteEntity.Id))!
            .SetValue(existing, expected);

        var repo = new FakeClienteRepository([existing]);
        var handler = BuildHandler(repo);
        var command = new DeleteClienteCommand(expected);

        // Act
        await handler.Handle(command, CancellationToken.None);

        // Assert: repository received the exact Guid
        Assert.Equal(expected, repo.LastDeletedId);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Sequential deletes — two different clients deleted independently
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_TwoSequentialDeletes_BothSucceed()
    {
        // Arrange: two clients
        var c1 = ClienteEntity.Create("Empresa Seq1", "900001001-1", "3000010011", "Bogotá");
        var c2 = ClienteEntity.Create("Empresa Seq2", "900002002-2", "3000020022", "Medellín");
        var repo = new FakeClienteRepository([c1, c2]);
        var handler = BuildHandler(repo);

        // Act: delete both in sequence
        await handler.Handle(new DeleteClienteCommand(c1.Id), CancellationToken.None);
        await handler.Handle(new DeleteClienteCommand(c2.Id), CancellationToken.None);

        // Assert: repository is now empty
        var remaining = await repo.GetAllAsync(CancellationToken.None);
        Assert.Empty(remaining);
    }

    // ─────────────────────────────────────────────────────────────────────
    // NotFoundException message — includes the client id
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_NonExistentClient_ExceptionMessageContainsId()
    {
        // Arrange
        var repo = new FakeClienteRepository();
        var handler = BuildHandler(repo);
        var id = Guid.NewGuid();
        var command = new DeleteClienteCommand(id);

        // Act & Assert: exception message references the requested id for traceability
        var ex = await Assert.ThrowsAsync<NotFoundException>(
            () => handler.Handle(command, CancellationToken.None));

        Assert.Contains(id.ToString(), ex.Message);
    }
}
