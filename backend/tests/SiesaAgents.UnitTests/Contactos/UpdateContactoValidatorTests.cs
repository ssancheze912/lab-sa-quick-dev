using FluentValidation.TestHelper;
using SiesaAgents.Application.Contactos.DTOs;
using SiesaAgents.Application.Contactos.Validators;
using Xunit;

namespace SiesaAgents.UnitTests.Contactos;

/// <summary>
/// ATDD unit tests — Story 3.4: UpdateContactoRequestValidator (RED phase)
/// Tests fail until UpdateContactoRequestValidator and UpdateContactoRequest are implemented.
///
/// Test IDs covered:
///   TC-E3-3-4-UNIT-1 (P2) — Validator rejects null Nombre
///   TC-E3-3-4-UNIT-2 (P2) — Validator rejects null Cargo
///   TC-E3-3-4-UNIT-3 (P2) — Validator rejects null Telefono
///   TC-E3-3-4-UNIT-4 (P2) — Validator rejects null Email
/// </summary>
public class UpdateContactoValidatorTests
{
    private readonly UpdateContactoRequestValidator _validator = new();

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-4-UNIT-1 (P2) — Validator rejects null Nombre
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-4-UNIT-1 (P2)
    /// GIVEN an UpdateContactoRequest with Nombre set to null
    /// WHEN the validator is invoked
    /// THEN a validation error is produced for the Nombre field
    /// </summary>
    [Fact]
    public void Validate_WhenNombreIsNull_ShouldHaveValidationError()
    {
        // GIVEN: Request with null Nombre
        var request = new UpdateContactoRequest(
            Nombre: null!,
            Cargo: "Analista de Ventas",
            Telefono: "3001234567",
            Email: "contacto@empresa.co"
        );

        // WHEN: Validated
        var result = _validator.TestValidate(request);

        // THEN: Validation error on Nombre field (NotEmpty rule)
        result.ShouldHaveValidationErrorFor(x => x.Nombre);
    }

    [Fact]
    public void Validate_WhenNombreIsEmpty_ShouldHaveValidationError()
    {
        // GIVEN: Request with empty Nombre
        var request = new UpdateContactoRequest(
            Nombre: string.Empty,
            Cargo: "Analista de Ventas",
            Telefono: "3001234567",
            Email: "contacto@empresa.co"
        );

        // WHEN: Validated
        var result = _validator.TestValidate(request);

        // THEN: Validation error on Nombre field
        result.ShouldHaveValidationErrorFor(x => x.Nombre);
    }

    [Fact]
    public void Validate_WhenNombreExceeds255Chars_ShouldHaveValidationError()
    {
        // GIVEN: Request with Nombre of 256 characters (over MaximumLength(255))
        var request = new UpdateContactoRequest(
            Nombre: new string('X', 256),
            Cargo: "Analista",
            Telefono: "3001234567",
            Email: "contacto@empresa.co"
        );

        // WHEN: Validated
        var result = _validator.TestValidate(request);

        // THEN: Validation error on Nombre field (MaximumLength rule)
        result.ShouldHaveValidationErrorFor(x => x.Nombre);
    }

    [Fact]
    public void Validate_WhenNombreIs255Chars_ShouldNotHaveValidationError()
    {
        // GIVEN: Request with Nombre at exactly the 255-char boundary
        var request = new UpdateContactoRequest(
            Nombre: new string('N', 255),
            Cargo: "Analista",
            Telefono: "3001234567",
            Email: "contacto@empresa.co"
        );

        // WHEN: Validated
        var result = _validator.TestValidate(request);

        // THEN: No validation error on Nombre (boundary is inclusive)
        result.ShouldNotHaveValidationErrorFor(x => x.Nombre);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-4-UNIT-2 (P2) — Validator rejects null Cargo
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-4-UNIT-2 (P2)
    /// GIVEN an UpdateContactoRequest with Cargo set to null
    /// WHEN the validator is invoked
    /// THEN a validation error is produced for the Cargo field
    /// </summary>
    [Fact]
    public void Validate_WhenCargoIsNull_ShouldHaveValidationError()
    {
        // GIVEN: Request with null Cargo
        var request = new UpdateContactoRequest(
            Nombre: "María López",
            Cargo: null!,
            Telefono: "3001234567",
            Email: "contacto@empresa.co"
        );

        // WHEN: Validated
        var result = _validator.TestValidate(request);

        // THEN: Validation error on Cargo field (NotEmpty rule)
        result.ShouldHaveValidationErrorFor(x => x.Cargo);
    }

    [Fact]
    public void Validate_WhenCargoIsEmpty_ShouldHaveValidationError()
    {
        // GIVEN: Request with empty Cargo
        var request = new UpdateContactoRequest(
            Nombre: "María López",
            Cargo: string.Empty,
            Telefono: "3001234567",
            Email: "contacto@empresa.co"
        );

        // WHEN: Validated
        var result = _validator.TestValidate(request);

        // THEN: Validation error on Cargo field
        result.ShouldHaveValidationErrorFor(x => x.Cargo);
    }

    [Fact]
    public void Validate_WhenCargoExceeds255Chars_ShouldHaveValidationError()
    {
        // GIVEN: Request with Cargo of 256 characters (over MaximumLength(255))
        var request = new UpdateContactoRequest(
            Nombre: "María López",
            Cargo: new string('C', 256),
            Telefono: "3001234567",
            Email: "contacto@empresa.co"
        );

        // WHEN: Validated
        var result = _validator.TestValidate(request);

        // THEN: Validation error on Cargo field (MaximumLength rule)
        result.ShouldHaveValidationErrorFor(x => x.Cargo);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-4-UNIT-3 (P2) — Validator rejects null Telefono
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-4-UNIT-3 (P2)
    /// GIVEN an UpdateContactoRequest with Telefono set to null
    /// WHEN the validator is invoked
    /// THEN a validation error is produced for the Telefono field
    /// </summary>
    [Fact]
    public void Validate_WhenTelefonoIsNull_ShouldHaveValidationError()
    {
        // GIVEN: Request with null Telefono
        var request = new UpdateContactoRequest(
            Nombre: "María López",
            Cargo: "Directora Comercial",
            Telefono: null!,
            Email: "contacto@empresa.co"
        );

        // WHEN: Validated
        var result = _validator.TestValidate(request);

        // THEN: Validation error on Telefono field (NotEmpty rule)
        result.ShouldHaveValidationErrorFor(x => x.Telefono);
    }

    [Fact]
    public void Validate_WhenTelefonoIsEmpty_ShouldHaveValidationError()
    {
        // GIVEN: Request with empty Telefono
        var request = new UpdateContactoRequest(
            Nombre: "María López",
            Cargo: "Directora Comercial",
            Telefono: string.Empty,
            Email: "contacto@empresa.co"
        );

        // WHEN: Validated
        var result = _validator.TestValidate(request);

        // THEN: Validation error on Telefono field
        result.ShouldHaveValidationErrorFor(x => x.Telefono);
    }

    [Fact]
    public void Validate_WhenTelefonoExceeds50Chars_ShouldHaveValidationError()
    {
        // GIVEN: Request with Telefono of 51 characters (over MaximumLength(50))
        var request = new UpdateContactoRequest(
            Nombre: "María López",
            Cargo: "Directora Comercial",
            Telefono: new string('T', 51),
            Email: "contacto@empresa.co"
        );

        // WHEN: Validated
        var result = _validator.TestValidate(request);

        // THEN: Validation error on Telefono field (MaximumLength rule)
        result.ShouldHaveValidationErrorFor(x => x.Telefono);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-4-UNIT-4 (P2) — Validator rejects null Email
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-4-UNIT-4 (P2)
    /// GIVEN an UpdateContactoRequest with Email set to null
    /// WHEN the validator is invoked
    /// THEN a validation error is produced for the Email field
    /// </summary>
    [Fact]
    public void Validate_WhenEmailIsNull_ShouldHaveValidationError()
    {
        // GIVEN: Request with null Email
        var request = new UpdateContactoRequest(
            Nombre: "María López",
            Cargo: "Directora Comercial",
            Telefono: "3001234567",
            Email: null!
        );

        // WHEN: Validated
        var result = _validator.TestValidate(request);

        // THEN: Validation error on Email field (NotEmpty rule)
        result.ShouldHaveValidationErrorFor(x => x.Email);
    }

    [Fact]
    public void Validate_WhenEmailIsEmpty_ShouldHaveValidationError()
    {
        // GIVEN: Request with empty Email
        var request = new UpdateContactoRequest(
            Nombre: "María López",
            Cargo: "Directora Comercial",
            Telefono: "3001234567",
            Email: string.Empty
        );

        // WHEN: Validated
        var result = _validator.TestValidate(request);

        // THEN: Validation error on Email field
        result.ShouldHaveValidationErrorFor(x => x.Email);
    }

    [Fact]
    public void Validate_WhenEmailIsInvalidFormat_ShouldHaveValidationError()
    {
        // GIVEN: Request with malformed Email (missing @domain)
        var request = new UpdateContactoRequest(
            Nombre: "María López",
            Cargo: "Directora Comercial",
            Telefono: "3001234567",
            Email: "not-a-valid-email"
        );

        // WHEN: Validated
        var result = _validator.TestValidate(request);

        // THEN: Validation error on Email field (EmailAddress rule)
        result.ShouldHaveValidationErrorFor(x => x.Email);
    }

    [Fact]
    public void Validate_WhenEmailExceeds255Chars_ShouldHaveValidationError()
    {
        // GIVEN: Request with Email exceeding 255 characters
        var longLocal = new string('a', 250);
        var request = new UpdateContactoRequest(
            Nombre: "María López",
            Cargo: "Directora Comercial",
            Telefono: "3001234567",
            Email: $"{longLocal}@empresa.co"
        );

        // WHEN: Validated
        var result = _validator.TestValidate(request);

        // THEN: Validation error on Email field (MaximumLength rule)
        result.ShouldHaveValidationErrorFor(x => x.Email);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Happy path — valid request passes all rules
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Validate_WhenAllFieldsAreValid_ShouldNotHaveAnyValidationErrors()
    {
        // GIVEN: Request with all valid fields
        var request = new UpdateContactoRequest(
            Nombre: "María López",
            Cargo: "Directora Comercial",
            Telefono: "3001234567",
            Email: "maria.lopez@empresa.co"
        );

        // WHEN: Validated
        var result = _validator.TestValidate(request);

        // THEN: No validation errors
        result.ShouldNotHaveAnyValidationErrors();
    }
}
