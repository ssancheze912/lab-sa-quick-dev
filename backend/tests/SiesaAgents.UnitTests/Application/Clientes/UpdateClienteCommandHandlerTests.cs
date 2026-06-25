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
    private readonly List<ClienteEntity> _store = [];
    private readonly Exception? _updateThrows;

    public FakeUpdateClienteRepository(IEnumerable<ClienteEntity>? seed = null, Exception? updateThrows = null)
    {
        if (seed is not null) _store.AddRange(seed);
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
        return Task.FromResult(entity);
    }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

public class UpdateClienteCommandHandlerTests
{
    private static ClienteEntity MakeCliente(
        string nombre = "Empresa Original S.A.",
        string nit = "900000001-0",
        string telefono = "6011234567",
        string ciudad = "Bogotá")
        => ClienteEntity.Create(nombre, nit, telefono, ciudad);

    [Fact]
    public async Task HandleAsync_WithValidInput_UpdatesEntityAndReturnsClienteDto()
    {
        // Arrange
        var original = MakeCliente();
        var repo = new FakeUpdateClienteRepository(seed: [original]);
        var handler = new UpdateClienteCommandHandler(repo);
        var command = new UpdateClienteCommand(
            original.Id, "Empresa Actualizada S.A.", "900123456-7", "6019876543", "Medellín");

        // Act
        var result = await handler.HandleAsync(command);

        // Assert
        result.Should().NotBeNull();
        result.Should().BeOfType<ClienteDto>();
        result!.Id.Should().Be(original.Id);
        result.Nombre.Should().Be("Empresa Actualizada S.A.");
        result.Nit.Should().Be("900123456-7");
        result.Telefono.Should().Be("6019876543");
        result.Ciudad.Should().Be("Medellín");
        result.UpdatedAt.Should().BeCloseTo(DateTimeOffset.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task HandleAsync_WhenClientIdDoesNotExist_ReturnsNull()
    {
        // Arrange — empty repository, unknown ID
        var repo = new FakeUpdateClienteRepository();
        var handler = new UpdateClienteCommandHandler(repo);
        var command = new UpdateClienteCommand(
            Guid.NewGuid(), "Empresa", "900000001-1", "3001234567", "Cali");

        // Act
        var result = await handler.HandleAsync(command);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task HandleAsync_WhenRepositoryThrowsDbUpdateException_PropagatesException()
    {
        // Arrange — simulate duplicate NIT unique constraint violation
        var existing = MakeCliente();
        var dbException = new DbUpdateException("Unique constraint violation");
        var repo = new FakeUpdateClienteRepository(seed: [existing], updateThrows: dbException);
        var handler = new UpdateClienteCommandHandler(repo);
        var command = new UpdateClienteCommand(
            existing.Id, "Empresa", "900000002-2", "3001234567", "Bogotá");

        // Act
        Func<Task> act = () => handler.HandleAsync(command);

        // Assert
        await act.Should().ThrowAsync<DbUpdateException>();
    }

    [Fact]
    public void Validator_WithEmptyNombre_ReturnsValidationError()
    {
        // Arrange
        var validator = new UpdateClienteCommandValidator();
        var command = new UpdateClienteCommand(Guid.NewGuid(), "", "900123456-7", "6011234567", "Bogotá");

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Nombre");
    }

    [Fact]
    public void Validator_WithEmptyNit_ReturnsValidationError()
    {
        // Arrange
        var validator = new UpdateClienteCommandValidator();
        var command = new UpdateClienteCommand(Guid.NewGuid(), "Empresa", "", "6011234567", "Bogotá");

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Nit");
    }

    [Fact]
    public void Validator_WithEmptyTelefono_ReturnsValidationError()
    {
        // Arrange
        var validator = new UpdateClienteCommandValidator();
        var command = new UpdateClienteCommand(Guid.NewGuid(), "Empresa", "900123456-7", "", "Bogotá");

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Telefono");
    }

    [Fact]
    public void Validator_WithEmptyCiudad_ReturnsValidationError()
    {
        // Arrange
        var validator = new UpdateClienteCommandValidator();
        var command = new UpdateClienteCommand(Guid.NewGuid(), "Empresa", "900123456-7", "6011234567", "");

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Ciudad");
    }

    [Fact]
    public void Validator_WithFieldExceedingMaxLength_ReturnsValidationError()
    {
        // Arrange
        var validator = new UpdateClienteCommandValidator();
        var tooLong = new string('x', 201);
        var command = new UpdateClienteCommand(Guid.NewGuid(), tooLong, "900123456-7", "6011234567", "Bogotá");

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Nombre");
    }

    [Fact]
    public void Validator_WithAllValidFields_ReturnsValid()
    {
        // Arrange
        var validator = new UpdateClienteCommandValidator();
        var command = new UpdateClienteCommand(
            Guid.NewGuid(), "Empresa Actualizada S.A.", "900123456-7", "6011234567", "Bogotá");

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validator_WithEmptyId_ReturnsValidationError()
    {
        // Arrange
        var validator = new UpdateClienteCommandValidator();
        var command = new UpdateClienteCommand(Guid.Empty, "Empresa", "900123456-7", "6011234567", "Bogotá");

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Id");
    }
}
