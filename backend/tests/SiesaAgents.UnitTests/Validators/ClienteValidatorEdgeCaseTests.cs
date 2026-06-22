using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.Validators;

namespace SiesaAgents.UnitTests.Validators;

/// <summary>
/// Edge case and boundary tests for CreateClienteCommandValidator — Story 2.3.
/// BMad-Integrated: expands coverage beyond ATDD with boundary values, all-empty,
/// max length, whitespace-only, and multi-field failure scenarios.
///
/// Test IDs: UNIT-B-VAL-EDGE-01 … UNIT-B-VAL-EDGE-12
/// </summary>
public class ClienteValidatorEdgeCaseTests
{
    private readonly CreateClienteCommandValidator _validator = new();

    // ---------------------------------------------------------------------------
    // UNIT-B-VAL-EDGE-01: All fields empty → all four properties fail
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validate_AllFieldsEmpty_ReturnsFourErrors()
    {
        var command = new CreateClienteCommand(string.Empty, string.Empty, string.Empty, string.Empty);

        var result = await _validator.ValidateAsync(command);

        Assert.False(result.IsValid);
        var properties = result.Errors.Select(e => e.PropertyName).Distinct().ToList();
        Assert.Contains(nameof(CreateClienteCommand.Nombre), properties);
        Assert.Contains(nameof(CreateClienteCommand.Nit), properties);
        Assert.Contains(nameof(CreateClienteCommand.Telefono), properties);
        Assert.Contains(nameof(CreateClienteCommand.Ciudad), properties);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-VAL-EDGE-02: Whitespace-only Nombre fails validation
    // FluentValidation NotEmpty() treats whitespace-only strings as empty.
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validate_WhitespaceOnlyNombre_ReturnsInvalidResult()
    {
        var command = new CreateClienteCommand("   ", "900000001-0", "3001234567", "Bogotá");

        var result = await _validator.ValidateAsync(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateClienteCommand.Nombre));
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-VAL-EDGE-03: Whitespace-only Nit fails validation
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validate_WhitespaceOnlyNit_ReturnsInvalidResult()
    {
        var command = new CreateClienteCommand("Empresa Test", "   ", "3001234567", "Bogotá");

        var result = await _validator.ValidateAsync(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateClienteCommand.Nit));
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-VAL-EDGE-04: Whitespace-only Telefono fails validation
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validate_WhitespaceOnlyTelefono_ReturnsInvalidResult()
    {
        var command = new CreateClienteCommand("Empresa Test", "900000001-0", "   ", "Bogotá");

        var result = await _validator.ValidateAsync(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateClienteCommand.Telefono));
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-VAL-EDGE-05: Whitespace-only Ciudad fails validation
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validate_WhitespaceOnlyCiudad_ReturnsInvalidResult()
    {
        var command = new CreateClienteCommand("Empresa Test", "900000001-0", "3001234567", "   ");

        var result = await _validator.ValidateAsync(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateClienteCommand.Ciudad));
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-VAL-EDGE-06: Nombre at exactly max length (200 chars) passes
    // Boundary: the MaximumLength rule only rejects length > 200.
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validate_NombreAt200Chars_ReturnsValidResult()
    {
        var command = new CreateClienteCommand(new string('A', 200), "900000001-0", "3001234567", "Bogotá");

        var result = await _validator.ValidateAsync(command);

        Assert.True(result.IsValid);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-VAL-EDGE-07: Nombre at 201 chars fails MaximumLength rule
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validate_NombreAt201Chars_ReturnsInvalidResult()
    {
        var command = new CreateClienteCommand(new string('A', 201), "900000001-0", "3001234567", "Bogotá");

        var result = await _validator.ValidateAsync(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e =>
            e.PropertyName == nameof(CreateClienteCommand.Nombre) &&
            e.ErrorMessage.Contains("200"));
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-VAL-EDGE-08: Nit at exactly max length (50 chars) passes
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validate_NitAt50Chars_ReturnsValidResult()
    {
        var command = new CreateClienteCommand("Empresa OK", new string('9', 50), "3001234567", "Bogotá");

        var result = await _validator.ValidateAsync(command);

        Assert.True(result.IsValid);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-VAL-EDGE-09: Nit at 51 chars fails MaximumLength rule
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validate_NitAt51Chars_ReturnsInvalidResult()
    {
        var command = new CreateClienteCommand("Empresa OK", new string('9', 51), "3001234567", "Bogotá");

        var result = await _validator.ValidateAsync(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e =>
            e.PropertyName == nameof(CreateClienteCommand.Nit) &&
            e.ErrorMessage.Contains("50"));
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-VAL-EDGE-10: Telefono at exactly max length (50 chars) passes
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validate_TelefonoAt50Chars_ReturnsValidResult()
    {
        var command = new CreateClienteCommand("Empresa OK", "900000001-0", new string('3', 50), "Bogotá");

        var result = await _validator.ValidateAsync(command);

        Assert.True(result.IsValid);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-VAL-EDGE-11: Ciudad at exactly max length (100 chars) passes
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validate_CiudadAt100Chars_ReturnsValidResult()
    {
        var command = new CreateClienteCommand("Empresa OK", "900000001-0", "3001234567", new string('B', 100));

        var result = await _validator.ValidateAsync(command);

        Assert.True(result.IsValid);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-VAL-EDGE-12: Ciudad at 101 chars fails MaximumLength rule
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validate_CiudadAt101Chars_ReturnsInvalidResult()
    {
        var command = new CreateClienteCommand("Empresa OK", "900000001-0", "3001234567", new string('B', 101));

        var result = await _validator.ValidateAsync(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e =>
            e.PropertyName == nameof(CreateClienteCommand.Ciudad) &&
            e.ErrorMessage.Contains("100"));
    }
}
