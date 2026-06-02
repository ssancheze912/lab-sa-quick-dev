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

    // ---------------------------------------------------------------------------
    // Edge cases — Story 2.4 expansion
    // Test IDs: UNIT-B-EC-01 … UNIT-B-EC-08
    // ---------------------------------------------------------------------------

    // ---------------------------------------------------------------------------
    // UNIT-B-EC-01: UpdateClienteCommandValidator — empty Nit fails validation
    // Boundary: Nit has its own NotEmpty rule (all 4 fields required)
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task UpdateValidator_EmptyNit_ReturnsInvalidResultWithMessage()
    {
        var command = new UpdateClienteCommand(Guid.NewGuid(), "Empresa Test", string.Empty, "3001234567", "Bogotá");

        var result = await _updateValidator.ValidateAsync(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateClienteCommand.Nit));
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-EC-02: UpdateClienteCommandValidator — empty Telefono fails validation
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task UpdateValidator_EmptyTelefono_ReturnsInvalidResult()
    {
        var command = new UpdateClienteCommand(Guid.NewGuid(), "Empresa Test", "900000001-0", string.Empty, "Bogotá");

        var result = await _updateValidator.ValidateAsync(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateClienteCommand.Telefono));
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-EC-03: UpdateClienteCommandValidator — empty Ciudad fails validation
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task UpdateValidator_EmptyCiudad_ReturnsInvalidResult()
    {
        var command = new UpdateClienteCommand(Guid.NewGuid(), "Empresa Test", "900000001-0", "3001234567", string.Empty);

        var result = await _updateValidator.ValidateAsync(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateClienteCommand.Ciudad));
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-EC-04: UpdateClienteCommandValidator — all four fields empty produces
    //   four separate error entries, one per field
    // Boundary: all rules evaluated independently (no short-circuit)
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task UpdateValidator_AllFieldsEmpty_ReturnsFourErrors()
    {
        var command = new UpdateClienteCommand(Guid.NewGuid(), string.Empty, string.Empty, string.Empty, string.Empty);

        var result = await _updateValidator.ValidateAsync(command);

        Assert.False(result.IsValid);
        Assert.True(result.Errors.Count >= 4, $"Expected at least 4 errors, got {result.Errors.Count}");
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateClienteCommand.Nombre));
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateClienteCommand.Nit));
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateClienteCommand.Telefono));
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateClienteCommand.Ciudad));
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-EC-05: UpdateClienteCommandValidator — Nombre exceeding 200 chars fails
    // Boundary: MaximumLength(200) rule enforced
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task UpdateValidator_NombreExceeds200Chars_ReturnsInvalidResult()
    {
        var longNombre = new string('A', 201);
        var command = new UpdateClienteCommand(Guid.NewGuid(), longNombre, "900000001-0", "3001234567", "Bogotá");

        var result = await _updateValidator.ValidateAsync(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateClienteCommand.Nombre));
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-EC-06: UpdateClienteCommandValidator — Nombre at exactly 200 chars passes
    // Boundary: MaximumLength(200) is inclusive (200 is valid, 201 is not)
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task UpdateValidator_NombreAtExactly200Chars_IsValid()
    {
        var exactNombre = new string('A', 200);
        var command = new UpdateClienteCommand(Guid.NewGuid(), exactNombre, "900000001-0", "3001234567", "Bogotá");

        var result = await _updateValidator.ValidateAsync(command);

        Assert.True(result.IsValid, $"Expected valid but got errors: {string.Join(", ", result.Errors.Select(e => e.ErrorMessage))}");
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-EC-07: UpdateClienteCommandValidator — Nit exceeding 50 chars fails
    // Boundary: MaximumLength(50) on Nit
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task UpdateValidator_NitExceeds50Chars_ReturnsInvalidResult()
    {
        var longNit = new string('9', 51);
        var command = new UpdateClienteCommand(Guid.NewGuid(), "Empresa Test", longNit, "3001234567", "Bogotá");

        var result = await _updateValidator.ValidateAsync(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateClienteCommand.Nit));
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-EC-08: UpdateClienteCommandValidator — Ciudad exceeding 100 chars fails
    // Boundary: MaximumLength(100) on Ciudad
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task UpdateValidator_CiudadExceeds100Chars_ReturnsInvalidResult()
    {
        var longCiudad = new string('B', 101);
        var command = new UpdateClienteCommand(Guid.NewGuid(), "Empresa Test", "900000001-0", "3001234567", longCiudad);

        var result = await _updateValidator.ValidateAsync(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateClienteCommand.Ciudad));
    }
}
