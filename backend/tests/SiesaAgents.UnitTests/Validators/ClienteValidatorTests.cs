using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.Validators;

namespace SiesaAgents.UnitTests.Validators;

/// <summary>
/// Unit tests for CreateClienteCommandValidator and UpdateClienteCommandValidator.
///
/// Test IDs: UNIT-B-01, UNIT-B-02, UNIT-B-03, UNIT-B-09, UNIT-B-10
/// </summary>
public class ClienteValidatorTests
{
    private readonly CreateClienteCommandValidator _createValidator = new();
    private readonly UpdateClienteCommandValidator _updateValidator = new();

    // ---------------------------------------------------------------------------
    // UNIT-B-01: empty Nombre fails validation (Create)
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validate_EmptyNombre_ReturnsInvalidResult()
    {
        var command = new CreateClienteCommand(string.Empty, "900000001-0", "3001234567", "Bogotá");

        var result = await _createValidator.ValidateAsync(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateClienteCommand.Nombre));
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-02: empty Nit fails validation (Create)
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validate_EmptyNit_ReturnsInvalidResult()
    {
        var command = new CreateClienteCommand("Empresa Test", string.Empty, "3001234567", "Bogotá");

        var result = await _createValidator.ValidateAsync(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateClienteCommand.Nit));
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-03: valid payload passes validation (Create)
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validate_ValidPayload_ReturnsValidResult()
    {
        var command = new CreateClienteCommand("Empresa Test SAS", "900000001-0", "3001234567", "Bogotá");

        var result = await _createValidator.ValidateAsync(command);

        Assert.True(result.IsValid);
        Assert.Empty(result.Errors);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-09: UpdateClienteCommandValidator — empty Nombre fails with error message
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task UpdateValidator_EmptyNombre_ReturnsInvalidResultWithMessage()
    {
        var command = new UpdateClienteCommand(Guid.NewGuid(), string.Empty, "900000009-0", "3001234567", "Bogotá");

        var result = await _updateValidator.ValidateAsync(command);

        Assert.False(result.IsValid);
        var nombreError = Assert.Single(result.Errors, e => e.PropertyName == nameof(UpdateClienteCommand.Nombre));
        Assert.False(string.IsNullOrWhiteSpace(nombreError.ErrorMessage));
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-10: UpdateClienteCommandValidator — valid payload passes validation
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task UpdateValidator_ValidPayload_ReturnsValidResult()
    {
        var command = new UpdateClienteCommand(Guid.NewGuid(), "Empresa Test SAS", "900000010-0", "3001234567", "Bogotá");

        var result = await _updateValidator.ValidateAsync(command);

        Assert.True(result.IsValid);
        Assert.Empty(result.Errors);
    }
}
