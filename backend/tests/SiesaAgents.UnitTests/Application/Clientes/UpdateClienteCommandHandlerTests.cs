/**
 * Story 2.4: UpdateClienteCommandHandler — Unit Tests (ATDD RED Phase)
 * Tests intentionally fail until UpdateClienteCommand/Handler/Validator are implemented.
 *
 * Acceptance Criteria covered:
 * - AC2: Handler updates entity and returns updated ClienteDto on valid input
 * - AC2: Handler returns null when client ID does not exist (endpoint sends 404)
 * - AC3: Validator rejects empty Nombre, Nit, Telefono, Ciudad
 * - AC3: Validator rejects fields exceeding max length (200 chars)
 * - AC5: Handler propagates DbUpdateException for duplicate NIT (middleware maps to 409)
 */

using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using Xunit;

namespace SiesaAgents.UnitTests.Application.Clientes;

// ─── Fake Repository ──────────────────────────────────────────────────────────

file sealed class FakeUpdateClienteRepository : IClienteRepository
{
    private readonly List<ClienteEntity> _store;
    private readonly Exception? _updateThrows;

    public FakeUpdateClienteRepository(
        IEnumerable<ClienteEntity>? seed = null,
        Exception? updateThrows = null)
    {
        _store = seed?.ToList() ?? [];
        _updateThrows = updateThrows;
    }

    public Task<IEnumerable<ClienteEntity>> GetAllAsync()
        => Task.FromResult<IEnumerable<ClienteEntity>>(_store);

    public Task<ClienteEntity?> GetByIdAsync(Guid id)
        => Task.FromResult(_store.FirstOrDefault(e => e.Id == id));

    public Task<ClienteEntity> CreateAsync(ClienteEntity entity)
    {
        _store.Add(entity);
        return Task.FromResult(entity);
    }

    public Task<ClienteEntity> UpdateAsync(ClienteEntity entity)
    {
        if (_updateThrows is not null) throw _updateThrows;

        var index = _store.FindIndex(e => e.Id == entity.Id);
        if (index >= 0)
            _store[index] = entity;

        return Task.FromResult(entity);
    }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

public class UpdateClienteCommandHandlerTests
{
    // ─── AC2: Handler returns updated ClienteDto on valid input ───────────────

    [Fact]
    public async Task HandleAsync_WithValidInput_UpdatesEntityAndReturnsClienteDto()
    {
        // Arrange — GIVEN: An existing client in the repository
        var existing = ClienteEntity.Create("Empresa Original S.A.", "900123456-7", "6011234567", "Bogotá");
        var repo = new FakeUpdateClienteRepository(seed: [existing]);
        var handler = new UpdateClienteCommandHandler(repo);

        var command = new UpdateClienteCommand(
            existing.Id,
            "Empresa Actualizada S.A.",
            "900999888-7",
            "6019876543",
            "Medellín");

        // Act — WHEN: Handler processes the update command
        var result = await handler.HandleAsync(command);

        // Assert — THEN: Returns updated ClienteDto with new values
        result.Should().NotBeNull();
        result.Should().BeOfType<ClienteDto>();
        result!.Id.Should().Be(existing.Id);
        result.Nombre.Should().Be("Empresa Actualizada S.A.");
        result.Nit.Should().Be("900999888-7");
        result.Telefono.Should().Be("6019876543");
        result.Ciudad.Should().Be("Medellín");
    }

    [Fact]
    public async Task HandleAsync_WithValidInput_UpdatedAtIsRecent()
    {
        // Arrange — GIVEN: An existing client
        var existing = ClienteEntity.Create("Empresa S.A.", "111111111-1", "3001234567", "Bogotá");
        var repo = new FakeUpdateClienteRepository(seed: [existing]);
        var handler = new UpdateClienteCommandHandler(repo);

        var command = new UpdateClienteCommand(existing.Id, "Empresa Actualizada", "222222222-2", "3001234567", "Cali");

        // Act — WHEN: Handler processes update
        var result = await handler.HandleAsync(command);

        // Assert — THEN: UpdatedAt reflects the time of the update (DateTimeOffset.UtcNow, never DateTime)
        result.Should().NotBeNull();
        result!.UpdatedAt.Should().BeCloseTo(DateTimeOffset.UtcNow, TimeSpan.FromSeconds(5));
        result.UpdatedAt.Offset.Should().Be(TimeSpan.Zero); // UTC only
    }

    // ─── AC2: Handler returns null when client ID does not exist ──────────────

    [Fact]
    public async Task HandleAsync_WhenClientDoesNotExist_ReturnsNull()
    {
        // Arrange — GIVEN: An empty repository (no clients)
        var repo = new FakeUpdateClienteRepository();
        var handler = new UpdateClienteCommandHandler(repo);

        var nonExistentId = Guid.NewGuid();
        var command = new UpdateClienteCommand(nonExistentId, "Empresa", "900000001-1", "3001234567", "Bogotá");

        // Act — WHEN: Handler tries to update a non-existent client
        var result = await handler.HandleAsync(command);

        // Assert — THEN: Returns null so endpoint responds with 404
        result.Should().BeNull();
    }

    // ─── AC5: DbUpdateException propagation for duplicate NIT ────────────────

    [Fact]
    public async Task HandleAsync_WhenRepositoryThrowsDbUpdateException_PropagatesException()
    {
        // Arrange — GIVEN: Repository throws DbUpdateException (unique constraint violation on NIT)
        var existing = ClienteEntity.Create("Empresa S.A.", "900123456-7", "6011234567", "Bogotá");
        var dbException = new DbUpdateException("Unique constraint violation on uk_clientes_nit");

        var repo = new FakeUpdateClienteRepository(seed: [existing], updateThrows: dbException);
        var handler = new UpdateClienteCommandHandler(repo);

        var command = new UpdateClienteCommand(existing.Id, "Empresa S.A.", "DUPLICATE-NIT", "6011234567", "Bogotá");

        // Act — WHEN: Handler is called
        Func<Task> act = () => handler.HandleAsync(command);

        // Assert — THEN: DbUpdateException propagates so ExceptionHandlingMiddleware maps it to 409
        await act.Should().ThrowAsync<DbUpdateException>();
    }

    // ─── AC3: Validator — empty required fields ───────────────────────────────

    [Fact]
    public void Validator_WithEmptyNombre_ReturnsValidationError()
    {
        // Arrange — GIVEN: Command with empty Nombre
        var validator = new UpdateClienteCommandValidator();
        var command = new UpdateClienteCommand(Guid.NewGuid(), "", "900123456-7", "6011234567", "Bogotá");

        // Act — WHEN: Validator is invoked
        var result = validator.Validate(command);

        // Assert — THEN: Validation fails for Nombre
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Nombre");
    }

    [Fact]
    public void Validator_WithEmptyNit_ReturnsValidationError()
    {
        // Arrange — GIVEN: Command with empty Nit
        var validator = new UpdateClienteCommandValidator();
        var command = new UpdateClienteCommand(Guid.NewGuid(), "Empresa", "", "6011234567", "Bogotá");

        // Act — WHEN: Validator is invoked
        var result = validator.Validate(command);

        // Assert — THEN: Validation fails for Nit
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Nit");
    }

    [Fact]
    public void Validator_WithEmptyTelefono_ReturnsValidationError()
    {
        // Arrange — GIVEN: Command with empty Telefono
        var validator = new UpdateClienteCommandValidator();
        var command = new UpdateClienteCommand(Guid.NewGuid(), "Empresa", "900123456-7", "", "Bogotá");

        // Act — WHEN: Validator is invoked
        var result = validator.Validate(command);

        // Assert — THEN: Validation fails for Telefono
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Telefono");
    }

    [Fact]
    public void Validator_WithEmptyCiudad_ReturnsValidationError()
    {
        // Arrange — GIVEN: Command with empty Ciudad
        var validator = new UpdateClienteCommandValidator();
        var command = new UpdateClienteCommand(Guid.NewGuid(), "Empresa", "900123456-7", "6011234567", "");

        // Act — WHEN: Validator is invoked
        var result = validator.Validate(command);

        // Assert — THEN: Validation fails for Ciudad
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Ciudad");
    }

    [Fact]
    public void Validator_WithEmptyId_ReturnsValidationError()
    {
        // Arrange — GIVEN: Command with empty Guid Id
        var validator = new UpdateClienteCommandValidator();
        var command = new UpdateClienteCommand(Guid.Empty, "Empresa", "900123456-7", "6011234567", "Bogotá");

        // Act — WHEN: Validator is invoked
        var result = validator.Validate(command);

        // Assert — THEN: Validation fails for Id (must not be empty)
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Id");
    }

    // ─── AC3: Validator — max length exceeded ─────────────────────────────────

    [Fact]
    public void Validator_WithNombreExceedingMaxLength_ReturnsValidationError()
    {
        // Arrange — GIVEN: Nombre with 201 characters
        var validator = new UpdateClienteCommandValidator();
        var tooLong = new string('x', 201);
        var command = new UpdateClienteCommand(Guid.NewGuid(), tooLong, "900123456-7", "6011234567", "Bogotá");

        // Act — WHEN: Validator is invoked
        var result = validator.Validate(command);

        // Assert — THEN: Validation fails with error on Nombre
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Nombre");
    }

    [Fact]
    public void Validator_WithNitExceedingMaxLength_ReturnsValidationError()
    {
        // Arrange — GIVEN: Nit with 201 characters
        var validator = new UpdateClienteCommandValidator();
        var tooLong = new string('9', 201);
        var command = new UpdateClienteCommand(Guid.NewGuid(), "Empresa", tooLong, "6011234567", "Bogotá");

        // Act — WHEN: Validator is invoked
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Nit");
    }

    // ─── AC3: Validator — whitespace-only strings ─────────────────────────────

    [Fact]
    public void Validator_WithWhitespaceOnlyNombre_ReturnsValidationError()
    {
        // Arrange — GIVEN: Nombre is whitespace-only (should fail Must(NotWhiteSpace) rule)
        var validator = new UpdateClienteCommandValidator();
        var command = new UpdateClienteCommand(Guid.NewGuid(), "   ", "900123456-7", "6011234567", "Bogotá");

        // Act — WHEN: Validator is invoked
        var result = validator.Validate(command);

        // Assert — THEN: Validation fails for Nombre
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Nombre");
    }

    // ─── AC3: Validator — all valid fields passes ─────────────────────────────

    [Fact]
    public void Validator_WithAllValidFields_ReturnsValid()
    {
        // Arrange — GIVEN: All fields valid
        var validator = new UpdateClienteCommandValidator();
        var command = new UpdateClienteCommand(
            Guid.NewGuid(),
            "Empresa Actualizada S.A.",
            "900123456-7",
            "6011234567",
            "Bogotá");

        // Act — WHEN: Validator is invoked
        var result = validator.Validate(command);

        // Assert — THEN: Validation passes
        result.IsValid.Should().BeTrue();
    }
}
