using FluentValidation;
using SiesaAgents.Application.Contactos.Commands;
using SiesaAgents.Application.Contactos.DTOs;
using SiesaAgents.Application.Contactos.Validators;
using SiesaAgents.Domain.Contactos.Entities;
using SiesaAgents.Domain.Contactos.Interfaces;

namespace SiesaAgents.UnitTests.Handlers;

/// <summary>
/// Edge Case Unit Tests — Story 4.2: AssignClienteToContactoCommandHandler and related components.
///
/// Expands ATDD baseline (AssignClienteCommandHandlerTests.cs — UNIT-B-AC-01..03) with:
///   - UNIT-B-42-EDGE-01 [P1] AssignClienteId domain method bumps UpdatedAt and preserves CreatedAt
///   - UNIT-B-42-EDGE-02 [P1] AssignClienteId can be called twice: second call overwrites the first clienteId
///   - UNIT-B-42-EDGE-03 [P1] AssignClienteToContactoValidator: null ClienteId passes validation (disassociation is valid)
///   - UNIT-B-42-EDGE-04 [P1] AssignClienteToContactoValidator: Guid.Empty ClienteId fails validation
///   - UNIT-B-42-EDGE-05 [P1] AssignClienteToContactoValidator: non-empty valid UUID passes validation
///   - UNIT-B-42-EDGE-06 [P2] Handler respects CancellationToken: throws OperationCanceledException when cancelled
///   - UNIT-B-42-EDGE-07 [P2] Handler returns correct Nombre, Cargo, Telefono, Email in ContactoDto after assignment
///   - UNIT-B-42-EDGE-08 [P2] Reassignment from one clienteId to another: domain method sets new value, UpdateAsync called once
/// </summary>
public class AssignClienteCommandHandlerEdgeCaseTests
{
    // ---------------------------------------------------------------------------
    // UNIT-B-42-EDGE-01 [P1]
    // Given a ContactoEntity created with clienteId = null
    // When AssignClienteId(newClienteId) is called
    // Then ClienteId equals the new value
    //   AND UpdatedAt >= CreatedAt (UpdatedAt was bumped)
    //   AND CreatedAt is unchanged (immutable after Create)
    // ---------------------------------------------------------------------------
    [Fact]
    public void AssignClienteId_NewValue_BumpsUpdatedAtAndPreservesCreatedAt()
    {
        // GIVEN — fresh entity
        var entity = ContactoEntity.Create("Ana Torres", "Directora", "+57 300 000 0010", "a.torres@empresa.com");
        var originalCreatedAt = entity.CreatedAt;
        var originalUpdatedAt = entity.UpdatedAt;
        var newClienteId = Guid.NewGuid();

        // ACT — assign a client
        entity.AssignClienteId(newClienteId);

        // ASSERT — ClienteId is set
        Assert.Equal(newClienteId, entity.ClienteId);

        // AND — UpdatedAt is >= original (domain rule: assignment bumps UpdatedAt)
        Assert.True(entity.UpdatedAt >= originalUpdatedAt,
            "UpdatedAt must be >= its value before assignment");

        // AND — CreatedAt is preserved (immutable)
        Assert.Equal(originalCreatedAt, entity.CreatedAt);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-42-EDGE-02 [P1]
    // Given a ContactoEntity with clienteId = clienteA
    // When AssignClienteId(clienteB) is called (reassignment)
    // Then ClienteId equals clienteB (second call overwrites)
    //   AND calling AssignClienteId(null) after that sets ClienteId to null
    // ---------------------------------------------------------------------------
    [Fact]
    public void AssignClienteId_CalledTwice_SecondValueWins()
    {
        // GIVEN — entity assigned to clienteA
        var clienteA = Guid.NewGuid();
        var clienteB = Guid.NewGuid();
        var entity = ContactoEntity.Create("Pedro López", "Analista", "+57 310 000 0011", "p.lopez@empresa.com", clienteA);

        // ACT — reassign to clienteB
        entity.AssignClienteId(clienteB);
        Assert.Equal(clienteB, entity.ClienteId);

        // ACT — disassociate (null)
        entity.AssignClienteId(null);
        Assert.Null(entity.ClienteId);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-42-EDGE-03 [P1]
    // Given AssignClienteToContactoRequest with ClienteId = null (disassociation)
    // When the validator runs
    // Then validation passes (null ClienteId is explicitly allowed — disassociation is valid)
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validator_NullClienteId_PassesValidation()
    {
        // GIVEN — request with null clienteId (disassociation)
        var request = new AssignClienteToContactoRequest(null);
        var validator = new AssignClienteToContactoValidator();

        // WHEN — validate
        var result = await validator.ValidateAsync(request);

        // THEN — valid (null is explicitly allowed by the "When HasValue" guard)
        Assert.True(result.IsValid);
        Assert.Empty(result.Errors);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-42-EDGE-04 [P1]
    // Given AssignClienteToContactoRequest with ClienteId = Guid.Empty
    // When the validator runs
    // Then validation fails
    //   AND the error message is "El clienteId no puede ser un UUID vacío"
    //   AND no stack trace is exposed (validation error, not exception)
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validator_GuidEmptyClienteId_FailsValidation_WithSpanishMessage()
    {
        // GIVEN — request with Guid.Empty (explicitly rejected by the validator)
        var request = new AssignClienteToContactoRequest(Guid.Empty);
        var validator = new AssignClienteToContactoValidator();

        // WHEN — validate
        var result = await validator.ValidateAsync(request);

        // THEN — validation fails
        Assert.False(result.IsValid);
        Assert.NotEmpty(result.Errors);

        // AND — error message is in Spanish
        var error = result.Errors.First();
        Assert.Equal("El clienteId no puede ser un UUID vacío", error.ErrorMessage);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-42-EDGE-05 [P1]
    // Given AssignClienteToContactoRequest with a valid non-empty UUID
    // When the validator runs
    // Then validation passes
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validator_ValidNonEmptyClienteId_PassesValidation()
    {
        // GIVEN — request with a valid UUID
        var validClienteId = Guid.NewGuid();
        var request = new AssignClienteToContactoRequest(validClienteId);
        var validator = new AssignClienteToContactoValidator();

        // WHEN — validate
        var result = await validator.ValidateAsync(request);

        // THEN — validation passes
        Assert.True(result.IsValid);
        Assert.Empty(result.Errors);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-42-EDGE-06 [P2]
    // Given the handler is called with an already-cancelled CancellationToken
    // When HandleAsync is invoked
    // Then it propagates the cancellation (OperationCanceledException or TaskCanceledException)
    //   AND UpdateAsync is never called (no partial side effects)
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task HandleAsync_CancelledToken_PropagatesCancellation()
    {
        // GIVEN — a valid contact in the repository
        var existing = ContactoEntity.Create("Test Cancel", "Cargo", "+57 300 000 0012", "cancel@test.co");
        var repository = new CancellingContactoRepository(existing);
        var handler = new AssignClienteToContactoCommandHandler(repository);
        var command = new AssignClienteToContactoCommand(existing.Id, Guid.NewGuid());

        // AND — a pre-cancelled token
        using var cts = new CancellationTokenSource();
        cts.Cancel();

        // WHEN / THEN — cancellation propagates
        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => handler.HandleAsync(command, cts.Token)
        );

        // AND — UpdateAsync was never called
        Assert.Equal(0, repository.UpdateCallCount);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-42-EDGE-07 [P2]
    // Given a contact with complete fields (nombre, cargo, telefono, email)
    // When HandleAsync assigns a clienteId
    // Then the returned ContactoDto preserves all fields unchanged
    //   (only clienteId and updatedAt change — rest are read-only from the entity)
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task HandleAsync_ValidAssignment_ReturnsDtoWithAllFieldsPreserved()
    {
        // GIVEN — Contact with complete data
        const string nombre = "Lucía Mendoza";
        const string cargo = "VP Comercial";
        const string telefono = "+57 315 000 0013";
        const string email = "l.mendoza@empresa.com";
        var existing = ContactoEntity.Create(nombre, cargo, telefono, email);
        var clienteId = Guid.NewGuid();

        var repository = new CapturingContactoRepository(existing);
        var handler = new AssignClienteToContactoCommandHandler(repository);
        var command = new AssignClienteToContactoCommand(existing.Id, clienteId);

        // WHEN
        var dto = await handler.HandleAsync(command, CancellationToken.None);

        // THEN — all fields preserved in the DTO
        Assert.Equal(existing.Id, dto.Id);
        Assert.Equal(nombre, dto.Nombre);
        Assert.Equal(cargo, dto.Cargo);
        Assert.Equal(telefono, dto.Telefono);
        Assert.Equal(email, dto.Email);
        Assert.Equal(clienteId, dto.ClienteId);

        // AND — UpdateAsync was called exactly once
        Assert.Equal(1, repository.UpdateCallCount);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-42-EDGE-08 [P2]
    // Given a contact currently assigned to clienteA
    // When HandleAsync is called with clienteB (reassignment scenario)
    // Then the handler fetches the existing contact, calls AssignClienteId(clienteB),
    //   calls UpdateAsync exactly once, and returns a Dto with clienteId = clienteB
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task HandleAsync_Reassignment_SetsNewClienteIdAndCallsUpdateOnce()
    {
        // GIVEN — Contact assigned to clienteA
        var clienteA = Guid.NewGuid();
        var clienteB = Guid.NewGuid();
        var existing = ContactoEntity.Create("Reasignar Test", "Cargo", "+57 300 000 0014", "reasignar@test.co", clienteA);
        var repository = new CapturingContactoRepository(existing);
        var handler = new AssignClienteToContactoCommandHandler(repository);
        var command = new AssignClienteToContactoCommand(existing.Id, clienteB);

        // WHEN
        var dto = await handler.HandleAsync(command, CancellationToken.None);

        // THEN — dto has clienteB
        Assert.Equal(clienteB, dto.ClienteId);

        // AND — UpdateAsync called exactly once (no double-write)
        Assert.Equal(1, repository.UpdateCallCount);

        // AND — persisted entity has clienteB
        Assert.Equal(clienteB, repository.LastUpdated!.ClienteId);
    }

    // ---------------------------------------------------------------------------
    // Fake repositories
    // ---------------------------------------------------------------------------

    private sealed class CapturingContactoRepository : IContactoRepository
    {
        private readonly ContactoEntity? _existingEntity;
        public int UpdateCallCount { get; private set; }
        public ContactoEntity? LastUpdated { get; private set; }

        public CapturingContactoRepository(ContactoEntity? existingEntity)
        {
            _existingEntity = existingEntity;
        }

        public Task<ContactoEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromResult(_existingEntity is not null && _existingEntity.Id == id
                ? _existingEntity
                : null);

        public Task<ContactoEntity> UpdateAsync(ContactoEntity entity, CancellationToken ct)
        {
            UpdateCallCount++;
            LastUpdated = entity;
            return Task.FromResult(entity);
        }

        public Task<IEnumerable<ContactoEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult<IEnumerable<ContactoEntity>>(Array.Empty<ContactoEntity>());

        public Task<IEnumerable<ContactoEntity>> GetByClienteIdAsync(Guid clienteId, CancellationToken ct)
            => Task.FromResult<IEnumerable<ContactoEntity>>(Array.Empty<ContactoEntity>());

        public Task<ContactoEntity> CreateAsync(ContactoEntity entity, CancellationToken ct)
            => Task.FromResult(entity);

        public Task DeleteAsync(ContactoEntity entity, CancellationToken ct)
            => Task.CompletedTask;
    }

    /// <summary>
    /// A repository that raises OperationCanceledException on GetByIdAsync when the token is cancelled.
    /// </summary>
    private sealed class CancellingContactoRepository : IContactoRepository
    {
        private readonly ContactoEntity? _existingEntity;
        public int UpdateCallCount { get; private set; }

        public CancellingContactoRepository(ContactoEntity? existingEntity)
        {
            _existingEntity = existingEntity;
        }

        public Task<ContactoEntity?> GetByIdAsync(Guid id, CancellationToken ct)
        {
            ct.ThrowIfCancellationRequested();
            return Task.FromResult(_existingEntity is not null && _existingEntity.Id == id
                ? _existingEntity
                : null);
        }

        public Task<ContactoEntity> UpdateAsync(ContactoEntity entity, CancellationToken ct)
        {
            ct.ThrowIfCancellationRequested();
            UpdateCallCount++;
            return Task.FromResult(entity);
        }

        public Task<IEnumerable<ContactoEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult<IEnumerable<ContactoEntity>>(Array.Empty<ContactoEntity>());

        public Task<IEnumerable<ContactoEntity>> GetByClienteIdAsync(Guid clienteId, CancellationToken ct)
            => Task.FromResult<IEnumerable<ContactoEntity>>(Array.Empty<ContactoEntity>());

        public Task<ContactoEntity> CreateAsync(ContactoEntity entity, CancellationToken ct)
            => Task.FromResult(entity);

        public Task DeleteAsync(ContactoEntity entity, CancellationToken ct)
            => Task.CompletedTask;
    }
}
