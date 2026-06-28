using FluentValidation.TestHelper;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Validators;
using Xunit;

namespace SiesaAgents.UnitTests.Clientes;

/// <summary>
/// ATDD unit tests — Story 2.4: UpdateClienteRequestValidator (RED phase)
/// Tests fail until UpdateClienteRequestValidator and UpdateClienteRequest are implemented.
///
/// Test IDs covered:
///   TC-E2-2-4-UNIT-1 (P2) — Validator rejects null Nombre
///   TC-E2-2-4-UNIT-2 (P2) — Validator rejects null Nit
///   TC-E2-2-4-UNIT-3 (P2) — Validator rejects null Telefono
///   TC-E2-2-4-UNIT-4 (P2) — Validator rejects null Ciudad
/// </summary>
public class UpdateClienteValidatorTests
{
    private readonly UpdateClienteRequestValidator _validator = new();

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-4-UNIT-1 (P2) — Validator rejects null Nombre
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-4-UNIT-1 (P2)
    /// GIVEN an UpdateClienteRequest with Nombre set to null
    /// WHEN the validator is invoked
    /// THEN a validation error is produced for the Nombre field
    /// </summary>
    [Fact]
    public void Validate_WhenNombreIsNull_ShouldHaveValidationError()
    {
        // GIVEN: Request with null Nombre
        var request = new UpdateClienteRequest(
            Nombre: null!,
            Nit: "900123456-1",
            Telefono: "3001234567",
            Ciudad: "Bogotá"
        );

        // WHEN: Validated
        var result = _validator.TestValidate(request);

        // THEN: Validation error on Nombre field
        result.ShouldHaveValidationErrorFor(x => x.Nombre);
    }

    [Fact]
    public void Validate_WhenNombreIsEmpty_ShouldHaveValidationError()
    {
        // GIVEN: Request with empty Nombre
        var request = new UpdateClienteRequest(
            Nombre: string.Empty,
            Nit: "900123456-1",
            Telefono: "3001234567",
            Ciudad: "Bogotá"
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
        var request = new UpdateClienteRequest(
            Nombre: new string('X', 256),
            Nit: "900123456-1",
            Telefono: "3001234567",
            Ciudad: "Bogotá"
        );

        // WHEN: Validated
        var result = _validator.TestValidate(request);

        // THEN: Validation error on Nombre field
        result.ShouldHaveValidationErrorFor(x => x.Nombre);
    }

    [Fact]
    public void Validate_WhenNombreIs255Chars_ShouldNotHaveValidationError()
    {
        // GIVEN: Request with Nombre at exactly the 255-char boundary
        var request = new UpdateClienteRequest(
            Nombre: new string('Y', 255),
            Nit: "900123456-1",
            Telefono: "3001234567",
            Ciudad: "Bogotá"
        );

        // WHEN: Validated
        var result = _validator.TestValidate(request);

        // THEN: No validation error on Nombre
        result.ShouldNotHaveValidationErrorFor(x => x.Nombre);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-4-UNIT-2 (P2) — Validator rejects null Nit
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-4-UNIT-2 (P2)
    /// GIVEN an UpdateClienteRequest with Nit set to null
    /// WHEN the validator is invoked
    /// THEN a validation error is produced for the Nit field
    /// </summary>
    [Fact]
    public void Validate_WhenNitIsNull_ShouldHaveValidationError()
    {
        // GIVEN: Request with null Nit
        var request = new UpdateClienteRequest(
            Nombre: "Acme S.A.",
            Nit: null!,
            Telefono: "3001234567",
            Ciudad: "Bogotá"
        );

        // WHEN: Validated
        var result = _validator.TestValidate(request);

        // THEN: Validation error on Nit field
        result.ShouldHaveValidationErrorFor(x => x.Nit);
    }

    [Fact]
    public void Validate_WhenNitIsEmpty_ShouldHaveValidationError()
    {
        // GIVEN: Request with empty Nit
        var request = new UpdateClienteRequest(
            Nombre: "Acme S.A.",
            Nit: string.Empty,
            Telefono: "3001234567",
            Ciudad: "Bogotá"
        );

        // WHEN: Validated
        var result = _validator.TestValidate(request);

        // THEN: Validation error on Nit field
        result.ShouldHaveValidationErrorFor(x => x.Nit);
    }

    [Fact]
    public void Validate_WhenNitExceeds50Chars_ShouldHaveValidationError()
    {
        // GIVEN: Request with Nit of 51 characters (over MaximumLength(50))
        var request = new UpdateClienteRequest(
            Nombre: "Acme S.A.",
            Nit: new string('N', 51),
            Telefono: "3001234567",
            Ciudad: "Bogotá"
        );

        // WHEN: Validated
        var result = _validator.TestValidate(request);

        // THEN: Validation error on Nit field
        result.ShouldHaveValidationErrorFor(x => x.Nit);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-4-UNIT-3 (P2) — Validator rejects null Telefono
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-4-UNIT-3 (P2)
    /// GIVEN an UpdateClienteRequest with Telefono set to null
    /// WHEN the validator is invoked
    /// THEN a validation error is produced for the Telefono field
    /// </summary>
    [Fact]
    public void Validate_WhenTelefonoIsNull_ShouldHaveValidationError()
    {
        // GIVEN: Request with null Telefono
        var request = new UpdateClienteRequest(
            Nombre: "Acme S.A.",
            Nit: "900123456-1",
            Telefono: null!,
            Ciudad: "Bogotá"
        );

        // WHEN: Validated
        var result = _validator.TestValidate(request);

        // THEN: Validation error on Telefono field
        result.ShouldHaveValidationErrorFor(x => x.Telefono);
    }

    [Fact]
    public void Validate_WhenTelefonoIsEmpty_ShouldHaveValidationError()
    {
        // GIVEN: Request with empty Telefono
        var request = new UpdateClienteRequest(
            Nombre: "Acme S.A.",
            Nit: "900123456-1",
            Telefono: string.Empty,
            Ciudad: "Bogotá"
        );

        // WHEN: Validated
        var result = _validator.TestValidate(request);

        // THEN: Validation error on Telefono field
        result.ShouldHaveValidationErrorFor(x => x.Telefono);
    }

    [Fact]
    public void Validate_WhenTelefonoExceeds50Chars_ShouldHaveValidationError()
    {
        // GIVEN: Request with Telefono of 51 characters
        var request = new UpdateClienteRequest(
            Nombre: "Acme S.A.",
            Nit: "900123456-1",
            Telefono: new string('T', 51),
            Ciudad: "Bogotá"
        );

        // WHEN: Validated
        var result = _validator.TestValidate(request);

        // THEN: Validation error on Telefono field
        result.ShouldHaveValidationErrorFor(x => x.Telefono);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-4-UNIT-4 (P2) — Validator rejects null Ciudad
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-4-UNIT-4 (P2)
    /// GIVEN an UpdateClienteRequest with Ciudad set to null
    /// WHEN the validator is invoked
    /// THEN a validation error is produced for the Ciudad field
    /// </summary>
    [Fact]
    public void Validate_WhenCiudadIsNull_ShouldHaveValidationError()
    {
        // GIVEN: Request with null Ciudad
        var request = new UpdateClienteRequest(
            Nombre: "Acme S.A.",
            Nit: "900123456-1",
            Telefono: "3001234567",
            Ciudad: null!
        );

        // WHEN: Validated
        var result = _validator.TestValidate(request);

        // THEN: Validation error on Ciudad field
        result.ShouldHaveValidationErrorFor(x => x.Ciudad);
    }

    [Fact]
    public void Validate_WhenCiudadIsEmpty_ShouldHaveValidationError()
    {
        // GIVEN: Request with empty Ciudad
        var request = new UpdateClienteRequest(
            Nombre: "Acme S.A.",
            Nit: "900123456-1",
            Telefono: "3001234567",
            Ciudad: string.Empty
        );

        // WHEN: Validated
        var result = _validator.TestValidate(request);

        // THEN: Validation error on Ciudad field
        result.ShouldHaveValidationErrorFor(x => x.Ciudad);
    }

    [Fact]
    public void Validate_WhenCiudadExceeds100Chars_ShouldHaveValidationError()
    {
        // GIVEN: Request with Ciudad of 101 characters (over MaximumLength(100))
        var request = new UpdateClienteRequest(
            Nombre: "Acme S.A.",
            Nit: "900123456-1",
            Telefono: "3001234567",
            Ciudad: new string('C', 101)
        );

        // WHEN: Validated
        var result = _validator.TestValidate(request);

        // THEN: Validation error on Ciudad field
        result.ShouldHaveValidationErrorFor(x => x.Ciudad);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Happy path — valid request passes all rules
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Validate_WhenAllFieldsAreValid_ShouldNotHaveAnyValidationErrors()
    {
        // GIVEN: Request with all valid fields
        var request = new UpdateClienteRequest(
            Nombre: "Acme Soluciones S.A.",
            Nit: "900123456-1",
            Telefono: "3001234567",
            Ciudad: "Bogotá"
        );

        // WHEN: Validated
        var result = _validator.TestValidate(request);

        // THEN: No validation errors
        result.ShouldNotHaveAnyValidationErrors();
    }
}
