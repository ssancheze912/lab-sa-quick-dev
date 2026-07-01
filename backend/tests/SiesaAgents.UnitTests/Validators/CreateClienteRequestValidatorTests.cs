using SiesaAgents.Application.Commands.Clientes;
using SiesaAgents.Application.Validators;

namespace SiesaAgents.UnitTests.Validators;

/// <summary>
/// Story 2.3 (AC #4, TC-E2-P2-02): pure FluentValidation unit tests for
/// `CreateClienteRequestValidator`, independent of HTTP/`WebApplicationFactory`.
/// Pinpoints validation-logic bugs quickly, and proves backend validation does
/// not rely solely on the frontend Zod schema (R3).
///
/// RED PHASE: `CreateClienteCommand` and `CreateClienteRequestValidator` do not
/// exist yet (Story 2.3, Task 2).
/// </summary>
public class CreateClienteRequestValidatorTests
{
    private static CreateClienteCommand ValidCommand() =>
        new("Cliente Válido SAS", "900123456-1", "3001234567", "Bogotá");

    [Fact]
    public void Validate_WithAllFieldsPopulated_IsValid()
    {
        // GIVEN a command with all required fields populated
        var validator = new CreateClienteRequestValidator();
        var command = ValidCommand();

        // WHEN validating it
        var result = validator.Validate(command);

        // THEN validation succeeds
        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Validate_WithEmptyOrWhitespaceNombre_IsInvalid(string? nombre)
    {
        // GIVEN a command whose Nombre is empty/whitespace/null
        var validator = new CreateClienteRequestValidator();
        var command = ValidCommand() with { Nombre = nombre! };

        // WHEN validating it
        var result = validator.Validate(command);

        // THEN validation fails with an error on Nombre
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateClienteCommand.Nombre));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Validate_WithEmptyOrWhitespaceNit_IsInvalid(string? nit)
    {
        // GIVEN a command whose Nit is empty/whitespace/null
        var validator = new CreateClienteRequestValidator();
        var command = ValidCommand() with { Nit = nit! };

        // WHEN validating it
        var result = validator.Validate(command);

        // THEN validation fails with an error on Nit
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateClienteCommand.Nit));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Validate_WithEmptyOrWhitespaceTelefono_IsInvalid(string? telefono)
    {
        // GIVEN a command whose Telefono is empty/whitespace/null
        var validator = new CreateClienteRequestValidator();
        var command = ValidCommand() with { Telefono = telefono! };

        // WHEN validating it
        var result = validator.Validate(command);

        // THEN validation fails with an error on Telefono
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateClienteCommand.Telefono));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Validate_WithEmptyOrWhitespaceCiudad_IsInvalid(string? ciudad)
    {
        // GIVEN a command whose Ciudad is empty/whitespace/null
        var validator = new CreateClienteRequestValidator();
        var command = ValidCommand() with { Ciudad = ciudad! };

        // WHEN validating it
        var result = validator.Validate(command);

        // THEN validation fails with an error on Ciudad
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateClienteCommand.Ciudad));
    }

    [Fact]
    public void Validate_WithAllFieldsWhitespaceOnly_ReturnsAnErrorForEachField()
    {
        // GIVEN a command where every required field is whitespace-only
        var validator = new CreateClienteRequestValidator();
        var command = new CreateClienteCommand("   ", "   ", "   ", "   ");

        // WHEN validating it
        var result = validator.Validate(command);

        // THEN all four fields report a validation error
        Assert.False(result.IsValid);
        var invalidProperties = result.Errors.Select(e => e.PropertyName).Distinct().ToList();
        Assert.Contains(nameof(CreateClienteCommand.Nombre), invalidProperties);
        Assert.Contains(nameof(CreateClienteCommand.Nit), invalidProperties);
        Assert.Contains(nameof(CreateClienteCommand.Telefono), invalidProperties);
        Assert.Contains(nameof(CreateClienteCommand.Ciudad), invalidProperties);
    }

    // --- Edge cases (testarch-automate expansion) -----------------------------

    [Fact]
    public void Validate_WithOnlyNombreEmpty_ReportsExactlyOneErrorForNombre()
    {
        // GIVEN a command with only Nombre invalid, everything else valid — proves
        // rules are independent (no cross-field leakage / no over-reporting)
        var validator = new CreateClienteRequestValidator();
        var command = ValidCommand() with { Nombre = "" };

        // WHEN validating it
        var result = validator.Validate(command);

        // THEN only Nombre reports an error; the other three fields are clean
        Assert.False(result.IsValid);
        var invalidProperties = result.Errors.Select(e => e.PropertyName).Distinct().ToList();
        Assert.Equal([nameof(CreateClienteCommand.Nombre)], invalidProperties);
    }

    [Fact]
    public void Validate_WithLeadingAndTrailingWhitespaceAroundValidValue_IsValid()
    {
        // GIVEN a command whose fields carry incidental surrounding whitespace but
        // contain real content — NotEmpty() must not reject this (only pure
        // whitespace-only values are invalid; trimming to empty is the backend's
        // concern only for detecting truly blank input, not for rejecting padded
        // legitimate values)
        var validator = new CreateClienteRequestValidator();
        var command = new CreateClienteCommand("  Cliente Con Espacios  ", "  900123456-1  ", "  3001234567  ", "  Bogotá  ");

        // WHEN validating it
        var result = validator.Validate(command);

        // THEN validation succeeds
        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validate_WithVeryLongValuesInAllFields_IsStillValid()
    {
        // GIVEN a command with unusually long (but non-empty) values — NotEmpty()
        // has no max-length constraint, so this must not fail validation
        // (guards against an future accidental length rule regressing this path)
        var validator = new CreateClienteRequestValidator();
        var longValue = new string('A', 500);
        var command = new CreateClienteCommand(longValue, longValue, longValue, longValue);

        // WHEN validating it
        var result = validator.Validate(command);

        // THEN validation succeeds — no implicit max-length rule exists
        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validate_WithSingleNonWhitespaceCharacterPerField_IsValid()
    {
        // GIVEN a command where every field has exactly one non-whitespace
        // character — boundary case just above the empty/whitespace-only rejection
        var validator = new CreateClienteRequestValidator();
        var command = new CreateClienteCommand("A", "1", "1", "A");

        // WHEN validating it
        var result = validator.Validate(command);

        // THEN validation succeeds
        Assert.True(result.IsValid);
    }
}
