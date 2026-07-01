using SiesaAgents.Application.Commands.Contactos;
using SiesaAgents.Application.Validators;

namespace SiesaAgents.UnitTests.Validators;

/// <summary>
/// Story 3.3 (AC #4, TC-E3-P2-02): pure FluentValidation unit tests for
/// `CreateContactoRequestValidator`, independent of HTTP/`WebApplicationFactory`.
/// Pinpoints validation-logic bugs quickly, and proves backend validation does
/// not rely solely on the frontend Zod schema (R2/TC-E3-P0-03). Mirrors
/// `CreateClienteRequestValidatorTests` exactly (Story 2.3 precedent) — the
/// only structural difference is Contacto has four required fields
/// (`Nombre`, `Cargo`, `Telefono`, `Email`) and no unique-constraint field.
///
/// RED PHASE: `CreateContactoCommand` and `CreateContactoRequestValidator` do
/// not exist yet (Story 3.3, Task 2).
/// </summary>
public class CreateContactoRequestValidatorTests
{
    private static CreateContactoCommand ValidCommand() =>
        new("Contacto Válido", "Analista", "3001234567", "contacto.valido@ejemplo.co");

    [Fact]
    public void Validate_WithAllFieldsPopulated_IsValid()
    {
        // GIVEN a command with all required fields populated
        var validator = new CreateContactoRequestValidator();
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
        var validator = new CreateContactoRequestValidator();
        var command = ValidCommand() with { Nombre = nombre! };

        // WHEN validating it
        var result = validator.Validate(command);

        // THEN validation fails with an error on Nombre
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContactoCommand.Nombre));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Validate_WithEmptyOrWhitespaceCargo_IsInvalid(string? cargo)
    {
        // GIVEN a command whose Cargo is empty/whitespace/null
        var validator = new CreateContactoRequestValidator();
        var command = ValidCommand() with { Cargo = cargo! };

        // WHEN validating it
        var result = validator.Validate(command);

        // THEN validation fails with an error on Cargo
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContactoCommand.Cargo));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Validate_WithEmptyOrWhitespaceTelefono_IsInvalid(string? telefono)
    {
        // GIVEN a command whose Telefono is empty/whitespace/null
        var validator = new CreateContactoRequestValidator();
        var command = ValidCommand() with { Telefono = telefono! };

        // WHEN validating it
        var result = validator.Validate(command);

        // THEN validation fails with an error on Telefono
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContactoCommand.Telefono));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Validate_WithEmptyOrWhitespaceEmail_IsInvalid(string? email)
    {
        // GIVEN a command whose Email is empty/whitespace/null
        var validator = new CreateContactoRequestValidator();
        var command = ValidCommand() with { Email = email! };

        // WHEN validating it
        var result = validator.Validate(command);

        // THEN validation fails with an error on Email
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContactoCommand.Email));
    }

    [Fact]
    public void Validate_WithAllFieldsWhitespaceOnly_ReturnsAnErrorForEachField()
    {
        // GIVEN a command where every required field is whitespace-only
        var validator = new CreateContactoRequestValidator();
        var command = new CreateContactoCommand("   ", "   ", "   ", "   ");

        // WHEN validating it
        var result = validator.Validate(command);

        // THEN all four fields report a validation error
        Assert.False(result.IsValid);
        var invalidProperties = result.Errors.Select(e => e.PropertyName).Distinct().ToList();
        Assert.Contains(nameof(CreateContactoCommand.Nombre), invalidProperties);
        Assert.Contains(nameof(CreateContactoCommand.Cargo), invalidProperties);
        Assert.Contains(nameof(CreateContactoCommand.Telefono), invalidProperties);
        Assert.Contains(nameof(CreateContactoCommand.Email), invalidProperties);
    }

    // --- Edge cases ------------------------------------------------------------

    [Fact]
    public void Validate_WithOnlyNombreEmpty_ReportsExactlyOneErrorForNombre()
    {
        // GIVEN a command with only Nombre invalid, everything else valid — proves
        // rules are independent (no cross-field leakage / no over-reporting)
        var validator = new CreateContactoRequestValidator();
        var command = ValidCommand() with { Nombre = "" };

        // WHEN validating it
        var result = validator.Validate(command);

        // THEN only Nombre reports an error; the other three fields are clean
        Assert.False(result.IsValid);
        var invalidProperties = result.Errors.Select(e => e.PropertyName).Distinct().ToList();
        Assert.Equal([nameof(CreateContactoCommand.Nombre)], invalidProperties);
    }

    [Fact]
    public void Validate_WithNoEmailFormatRule_AcceptsAnyNonEmptyStringAsEmail()
    {
        // GIVEN a command whose Email is a non-empty string with no valid email
        // shape — the story's Dev Notes (TC-E3-P3-01) explicitly document that
        // NO format/regex rule is mandated on Email, only NotEmpty()
        var validator = new CreateContactoRequestValidator();
        var command = ValidCommand() with { Email = "no-es-un-email-valido" };

        // WHEN validating it
        var result = validator.Validate(command);

        // THEN validation succeeds — no format rule exists on Email
        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validate_WithLeadingAndTrailingWhitespaceAroundValidValue_IsValid()
    {
        // GIVEN a command whose fields carry incidental surrounding whitespace but
        // contain real content — NotEmpty() must not reject this
        var validator = new CreateContactoRequestValidator();
        var command = new CreateContactoCommand(
            "  Contacto Con Espacios  ",
            "  Analista  ",
            "  3001234567  ",
            "  contacto@ejemplo.co  ");

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
        var validator = new CreateContactoRequestValidator();
        var longValue = new string('A', 500);
        var command = new CreateContactoCommand(longValue, longValue, longValue, longValue);

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
        var validator = new CreateContactoRequestValidator();
        var command = new CreateContactoCommand("A", "A", "1", "A");

        // WHEN validating it
        var result = validator.Validate(command);

        // THEN validation succeeds
        Assert.True(result.IsValid);
    }
}
