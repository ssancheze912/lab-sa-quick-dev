using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using Xunit;

namespace SiesaAgents.UnitTests.Application.Clientes;

// ─── Fake Repository ──────────────────────────────────────────────────────────

file sealed class FakeCreateClienteRepository : IClienteRepository
{
    private readonly List<ClienteEntity> _store = [];
    private readonly Exception? _createThrows;

    public FakeCreateClienteRepository(Exception? createThrows = null)
    {
        _createThrows = createThrows;
    }

    public Task<IEnumerable<ClienteEntity>> GetAllAsync()
        => Task.FromResult<IEnumerable<ClienteEntity>>(_store);

    public Task<ClienteEntity?> GetByIdAsync(Guid id)
        => Task.FromResult(_store.FirstOrDefault(e => e.Id == id));

    public Task<ClienteEntity> CreateAsync(ClienteEntity entity)
    {
        if (_createThrows is not null) throw _createThrows;
        _store.Add(entity);
        return Task.FromResult(entity);
    }

    public Task<ClienteEntity> UpdateAsync(ClienteEntity entity)
        => Task.FromResult(entity);

    public Task<bool> DeleteAsync(Guid id)
        => Task.FromResult(true);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

public class CreateClienteCommandHandlerTests
{
    private static CreateClienteCommandHandler MakeHandler(Exception? createThrows = null)
        => new(new FakeCreateClienteRepository(createThrows));

    [Fact]
    public async Task HandleAsync_WithValidInput_CreatesEntityAndReturnsClienteDto()
    {
        // Arrange
        var handler = MakeHandler();
        var command = new CreateClienteCommand("Empresa Ejemplo S.A.", "900123456-7", "6011234567", "Bogotá");

        // Act
        var result = await handler.HandleAsync(command);

        // Assert
        result.Should().NotBeNull();
        result.Should().BeOfType<ClienteDto>();
        result.Id.Should().NotBeEmpty();
        result.Nombre.Should().Be("Empresa Ejemplo S.A.");
        result.Nit.Should().Be("900123456-7");
        result.Telefono.Should().Be("6011234567");
        result.Ciudad.Should().Be("Bogotá");
        result.CreatedAt.Should().BeCloseTo(DateTimeOffset.UtcNow, TimeSpan.FromSeconds(5));
        result.UpdatedAt.Should().BeCloseTo(DateTimeOffset.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task HandleAsync_WhenRepositoryThrowsDbUpdateException_PropagatesException()
    {
        // Arrange — simulate a DB unique constraint violation
        var dbException = new DbUpdateException("Unique constraint violation");
        var handler = MakeHandler(dbException);
        var command = new CreateClienteCommand("Empresa", "900123456-7", "6011111111", "Bogotá");

        // Act
        Func<Task> act = () => handler.HandleAsync(command);

        // Assert
        await act.Should().ThrowAsync<DbUpdateException>();
    }

    [Fact]
    public void Validator_WithEmptyNombre_ReturnsValidationError()
    {
        // Arrange
        var validator = new CreateClienteCommandValidator();
        var command = new CreateClienteCommand("", "900123456-7", "6011234567", "Bogotá");

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
        var validator = new CreateClienteCommandValidator();
        var command = new CreateClienteCommand("Empresa", "", "6011234567", "Bogotá");

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
        var validator = new CreateClienteCommandValidator();
        var command = new CreateClienteCommand("Empresa", "900123456-7", "", "Bogotá");

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
        var validator = new CreateClienteCommandValidator();
        var command = new CreateClienteCommand("Empresa", "900123456-7", "6011234567", "");

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
        var validator = new CreateClienteCommandValidator();
        var tooLong = new string('x', 201);
        var command = new CreateClienteCommand(tooLong, "900123456-7", "6011234567", "Bogotá");

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
        var validator = new CreateClienteCommandValidator();
        var command = new CreateClienteCommand("Empresa Ejemplo S.A.", "900123456-7", "6011234567", "Bogotá");

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validator_WithWhitespaceOnlyNombre_ReturnsValidationError()
    {
        // Arrange — whitespace-only strings bypass NotEmpty() in FluentValidation;
        // the Must() rule catches them.
        var validator = new CreateClienteCommandValidator();
        var command = new CreateClienteCommand("   ", "900123456-7", "6011234567", "Bogotá");

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Nombre");
    }
}
