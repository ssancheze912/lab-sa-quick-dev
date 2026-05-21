using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.Validators;

namespace SiesaAgents.UnitTests.Validators;

/// <summary>
/// Unit tests for CreateClienteCommandValidator — Story 2.3.
///
/// Test IDs: UNIT-B-01, UNIT-B-02, UNIT-B-03
/// </summary>
public class ClienteValidatorTests
{
    private readonly CreateClienteCommandValidator _validator = new();

    // ---------------------------------------------------------------------------
    // UNIT-B-01: empty Nombre fails validation
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validate_EmptyNombre_ReturnsInvalidResult()
    {
        var command = new CreateClienteCommand(string.Empty, "900000001-0", "3001234567", "Bogotá");

        var result = await _validator.ValidateAsync(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateClienteCommand.Nombre));
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-02: empty Nit fails validation
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validate_EmptyNit_ReturnsInvalidResult()
    {
        var command = new CreateClienteCommand("Empresa Test", string.Empty, "3001234567", "Bogotá");

        var result = await _validator.ValidateAsync(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateClienteCommand.Nit));
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-03: valid payload passes validation
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validate_ValidPayload_ReturnsValidResult()
    {
        var command = new CreateClienteCommand("Empresa Test SAS", "900000001-0", "3001234567", "Bogotá");

        var result = await _validator.ValidateAsync(command);

        Assert.True(result.IsValid);
        Assert.Empty(result.Errors);
    }
}
