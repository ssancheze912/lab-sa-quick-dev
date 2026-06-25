using FluentAssertions;
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using Xunit;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Edge case tests for CreateClienteCommandHandler and CreateClienteCommandValidator.
/// Expands ATDD coverage from CreateClienteCommandHandlerTests.cs with boundary
/// conditions, whitespace behavior, and multiple-field validation scenarios.
/// </summary>

// ─── Fake repository ──────────────────────────────────────────────────────────

file sealed class FakeEdgeRepository : IClienteRepository
{
    private readonly List<ClienteEntity> _store = [];
    private readonly Exception? _createThrows;

    public FakeEdgeRepository(Exception? createThrows = null)
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
}

// ─── Handler Edge Cases ───────────────────────────────────────────────────────

public class CreateClienteCommandHandlerEdgeCaseTests
{
    private static CreateClienteCommandHandler MakeHandler(Exception? createThrows = null)
        => new(new FakeEdgeRepository(createThrows));

    [Fact]
    public async Task HandleAsync_GeneratesNewGuidId_NotEmpty()
    {
        // Arrange — two separate calls should produce different GUIDs
        var handler = MakeHandler();
        var command1 = new CreateClienteCommand("Empresa Alpha", "900111111-1", "6011111111", "Bogotá");
        var command2 = new CreateClienteCommand("Empresa Beta", "900222222-2", "6022222222", "Medellín");

        // Act
        var result1 = await handler.HandleAsync(command1);
        var result2 = await handler.HandleAsync(command2);

        // Assert: IDs are non-empty GUIDs and different from each other
        result1.Id.Should().NotBeEmpty();
        result2.Id.Should().NotBeEmpty();
        result1.Id.Should().NotBe(result2.Id);
    }

    [Fact]
    public async Task HandleAsync_ReturnsCreatedAtAndUpdatedAtAsUtc()
    {
        // Arrange
        var handler = MakeHandler();
        var command = new CreateClienteCommand("Empresa UTC", "900UTC0001-0", "6010000001", "Bogotá");

        // Act
        var result = await handler.HandleAsync(command);

        // Assert: Timestamps are UTC (not local or unspecified)
        result.CreatedAt.Offset.Should().Be(TimeSpan.Zero);
        result.UpdatedAt.Offset.Should().Be(TimeSpan.Zero);
    }

    [Fact]
    public async Task HandleAsync_CreatedAtAndUpdatedAt_AreEqualOnCreate()
    {
        // Arrange
        var handler = MakeHandler();
        var command = new CreateClienteCommand("Empresa Timestamps", "900TS0001-0", "6010000010", "Bogotá");

        // Act
        var result = await handler.HandleAsync(command);

        // Assert: CreatedAt and UpdatedAt are equal (no update has occurred yet)
        result.CreatedAt.Should().BeCloseTo(result.UpdatedAt, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public async Task HandleAsync_MapsAllFieldsCorrectly_ToClienteDto()
    {
        // Arrange
        var handler = MakeHandler();
        var command = new CreateClienteCommand("Empresa Mapping Test", "900MAP001-0", "6001234567", "Cartagena");

        // Act
        var result = await handler.HandleAsync(command);

        // Assert: All four domain fields are correctly mapped from command to DTO
        result.Nombre.Should().Be("Empresa Mapping Test");
        result.Nit.Should().Be("900MAP001-0");
        result.Telefono.Should().Be("6001234567");
        result.Ciudad.Should().Be("Cartagena");
    }

    [Fact]
    public async Task HandleAsync_CanCreateMultipleClients_WithDifferentNits()
    {
        // Arrange — fake repo stores in-memory (no unique constraint in fake)
        var handler = MakeHandler();
        var command1 = new CreateClienteCommand("Empresa X", "900X0001-0", "6001110000", "Bogotá");
        var command2 = new CreateClienteCommand("Empresa Y", "900Y0002-0", "6002220000", "Cali");

        // Act
        var result1 = await handler.HandleAsync(command1);
        var result2 = await handler.HandleAsync(command2);

        // Assert: Both created successfully with distinct IDs and NITs
        result1.Id.Should().NotBe(result2.Id);
        result1.Nit.Should().NotBe(result2.Nit);
    }
}

// ─── Validator Edge Cases ─────────────────────────────────────────────────────

public class CreateClienteCommandValidatorEdgeCaseTests
{
    private static CreateClienteCommandValidator MakeValidator()
        => new();

    [Fact]
    public void Validator_WithWhitespaceOnlyNombre_ReturnsValidationError()
    {
        // Arrange: FluentValidation NotEmpty() rejects whitespace-only strings
        var validator = MakeValidator();
        var command = new CreateClienteCommand("   ", "900000001-0", "6011234567", "Bogotá");

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Nombre");
    }

    [Fact]
    public void Validator_WithWhitespaceOnlyNit_ReturnsValidationError()
    {
        // Arrange
        var validator = MakeValidator();
        var command = new CreateClienteCommand("Empresa", "   ", "6011234567", "Bogotá");

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Nit");
    }

    [Fact]
    public void Validator_WithWhitespaceOnlyTelefono_ReturnsValidationError()
    {
        // Arrange
        var validator = MakeValidator();
        var command = new CreateClienteCommand("Empresa", "900000001-0", "   ", "Bogotá");

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Telefono");
    }

    [Fact]
    public void Validator_WithWhitespaceOnlyCiudad_ReturnsValidationError()
    {
        // Arrange
        var validator = MakeValidator();
        var command = new CreateClienteCommand("Empresa", "900000001-0", "6011234567", "   ");

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Ciudad");
    }

    [Theory]
    [InlineData(200)] // exactly at limit — valid
    public void Validator_WithNombreAtExactMaxLength_ReturnsValid(int length)
    {
        // Arrange
        var validator = MakeValidator();
        var command = new CreateClienteCommand(new string('A', length), "900000001-0", "6011234567", "Bogotá");

        // Act
        var result = validator.Validate(command);

        // Assert: Exactly 200 chars is valid (MaximumLength(200) is inclusive)
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData(201)] // one over limit — invalid
    [InlineData(300)]
    public void Validator_WithNombreExceedingMaxLength_ReturnsValidationError(int length)
    {
        // Arrange
        var validator = MakeValidator();
        var command = new CreateClienteCommand(new string('A', length), "900000001-0", "6011234567", "Bogotá");

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Nombre");
    }

    [Theory]
    [InlineData(201)]
    [InlineData(300)]
    public void Validator_WithNitExceedingMaxLength_ReturnsValidationError(int length)
    {
        // Arrange
        var validator = MakeValidator();
        var command = new CreateClienteCommand("Empresa", new string('N', length), "6011234567", "Bogotá");

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Nit");
    }

    [Theory]
    [InlineData(201)]
    [InlineData(300)]
    public void Validator_WithTelefonoExceedingMaxLength_ReturnsValidationError(int length)
    {
        // Arrange
        var validator = MakeValidator();
        var command = new CreateClienteCommand("Empresa", "900000001-0", new string('1', length), "Bogotá");

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Telefono");
    }

    [Theory]
    [InlineData(201)]
    [InlineData(300)]
    public void Validator_WithCiudadExceedingMaxLength_ReturnsValidationError(int length)
    {
        // Arrange
        var validator = MakeValidator();
        var command = new CreateClienteCommand("Empresa", "900000001-0", "6011234567", new string('C', length));

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Ciudad");
    }

    [Fact]
    public void Validator_WithAllFieldsEmpty_ReturnsErrorsForAllFourFields()
    {
        // Arrange
        var validator = MakeValidator();
        var command = new CreateClienteCommand("", "", "", "");

        // Act
        var result = validator.Validate(command);

        // Assert: All four fields have errors
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Nombre");
        result.Errors.Should().Contain(e => e.PropertyName == "Nit");
        result.Errors.Should().Contain(e => e.PropertyName == "Telefono");
        result.Errors.Should().Contain(e => e.PropertyName == "Ciudad");
    }

    [Fact]
    public void Validator_WithSingleCharacterInAllFields_ReturnsValid()
    {
        // Arrange: Minimum valid input (1 char each, all within max length)
        var validator = MakeValidator();
        var command = new CreateClienteCommand("A", "9", "3", "B");

        // Act
        var result = validator.Validate(command);

        // Assert: Single characters are valid (length >= 1 and <= 200)
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validator_WithAllFieldsAtExactMaxLength_ReturnsValid()
    {
        // Arrange: All fields at 200 chars each (boundary)
        var validator = MakeValidator();
        var command = new CreateClienteCommand(
            new string('A', 200),
            new string('N', 200),
            new string('1', 200),
            new string('C', 200));

        // Act
        var result = validator.Validate(command);

        // Assert: All valid at boundary
        result.IsValid.Should().BeTrue();
    }
}
