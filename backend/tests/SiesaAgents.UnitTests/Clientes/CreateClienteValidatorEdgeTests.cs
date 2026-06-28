using FluentValidation.TestHelper;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Validators;
using Xunit;

namespace SiesaAgents.UnitTests.Clientes;

/// <summary>
/// Automation expansion — Story 2.3: CreateClienteRequestValidator edge cases.
/// Expands ATDD coverage (CreateClienteValidatorTests.cs) with:
///
///   [P2] Whitespace-only values rejected by NotEmpty() for each field
///   [P2] Boundary: Nit at exactly 50 chars passes; Telefono at exactly 50 chars passes;
///        Ciudad at exactly 100 chars passes (only Nombre boundary was covered)
///   [P3] All four fields invalid simultaneously — all errors reported
///   [P3] Single-character values at minimum boundary pass validation
/// </summary>
public class CreateClienteValidatorEdgeTests
{
    private readonly CreateClienteRequestValidator _validator = new();

    // ─────────────────────────────────────────────────────────────────────────
    // Whitespace-only values — NotEmpty() rejects whitespace
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P2] Whitespace-only Nombre is rejected (NotEmpty treats whitespace as empty).
    /// </summary>
    [Fact]
    public void Validate_WhenNombreIsWhitespaceOnly_ShouldHaveValidationError()
    {
        // GIVEN: Request with whitespace-only Nombre
        var request = new CreateClienteRequest(
            Nombre: "   ",
            Nit: "900123456-1",
            Telefono: "3001234567",
            Ciudad: "Bogotá"
        );

        // WHEN
        var result = _validator.TestValidate(request);

        // THEN: Validation error on Nombre
        result.ShouldHaveValidationErrorFor(x => x.Nombre);
    }

    /// <summary>
    /// [P2] Whitespace-only Nit is rejected.
    /// </summary>
    [Fact]
    public void Validate_WhenNitIsWhitespaceOnly_ShouldHaveValidationError()
    {
        // GIVEN: Request with whitespace-only Nit
        var request = new CreateClienteRequest(
            Nombre: "Acme S.A.",
            Nit: "   ",
            Telefono: "3001234567",
            Ciudad: "Bogotá"
        );

        // WHEN
        var result = _validator.TestValidate(request);

        // THEN: Validation error on Nit
        result.ShouldHaveValidationErrorFor(x => x.Nit);
    }

    /// <summary>
    /// [P2] Whitespace-only Telefono is rejected.
    /// </summary>
    [Fact]
    public void Validate_WhenTelefonoIsWhitespaceOnly_ShouldHaveValidationError()
    {
        // GIVEN: Request with whitespace-only Telefono
        var request = new CreateClienteRequest(
            Nombre: "Acme S.A.",
            Nit: "900123456-1",
            Telefono: "   ",
            Ciudad: "Bogotá"
        );

        // WHEN
        var result = _validator.TestValidate(request);

        // THEN: Validation error on Telefono
        result.ShouldHaveValidationErrorFor(x => x.Telefono);
    }

    /// <summary>
    /// [P2] Whitespace-only Ciudad is rejected.
    /// </summary>
    [Fact]
    public void Validate_WhenCiudadIsWhitespaceOnly_ShouldHaveValidationError()
    {
        // GIVEN: Request with whitespace-only Ciudad
        var request = new CreateClienteRequest(
            Nombre: "Acme S.A.",
            Nit: "900123456-1",
            Telefono: "3001234567",
            Ciudad: "   "
        );

        // WHEN
        var result = _validator.TestValidate(request);

        // THEN: Validation error on Ciudad
        result.ShouldHaveValidationErrorFor(x => x.Ciudad);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Nit boundary: exactly 50 chars → passes; exactly 51 chars → fails
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P2] Nit at exactly 50 characters passes MaximumLength(50).
    /// </summary>
    [Fact]
    public void Validate_WhenNitIs50Chars_ShouldNotHaveValidationError()
    {
        // GIVEN: Nit at exactly the 50-char max boundary
        var request = new CreateClienteRequest(
            Nombre: "Acme S.A.",
            Nit: new string('N', 50),
            Telefono: "3001234567",
            Ciudad: "Bogotá"
        );

        // WHEN
        var result = _validator.TestValidate(request);

        // THEN: No validation error on Nit
        result.ShouldNotHaveValidationErrorFor(x => x.Nit);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Telefono boundary: exactly 50 chars → passes; exactly 51 chars → fails
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P2] Telefono at exactly 50 characters passes MaximumLength(50).
    /// </summary>
    [Fact]
    public void Validate_WhenTelefonoIs50Chars_ShouldNotHaveValidationError()
    {
        // GIVEN: Telefono at exactly the 50-char max boundary
        var request = new CreateClienteRequest(
            Nombre: "Acme S.A.",
            Nit: "900123456-1",
            Telefono: new string('T', 50),
            Ciudad: "Bogotá"
        );

        // WHEN
        var result = _validator.TestValidate(request);

        // THEN: No validation error on Telefono
        result.ShouldNotHaveValidationErrorFor(x => x.Telefono);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Ciudad boundary: exactly 100 chars → passes; exactly 101 chars → fails
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P2] Ciudad at exactly 100 characters passes MaximumLength(100).
    /// </summary>
    [Fact]
    public void Validate_WhenCiudadIs100Chars_ShouldNotHaveValidationError()
    {
        // GIVEN: Ciudad at exactly the 100-char max boundary
        var request = new CreateClienteRequest(
            Nombre: "Acme S.A.",
            Nit: "900123456-1",
            Telefono: "3001234567",
            Ciudad: new string('C', 100)
        );

        // WHEN
        var result = _validator.TestValidate(request);

        // THEN: No validation error on Ciudad
        result.ShouldNotHaveValidationErrorFor(x => x.Ciudad);
    }

    /// <summary>
    /// [P2] Ciudad at exactly 101 characters fails MaximumLength(100).
    /// </summary>
    [Fact]
    public void Validate_WhenCiudadIs101Chars_ShouldHaveValidationError()
    {
        // GIVEN: Ciudad one character over the max boundary
        var request = new CreateClienteRequest(
            Nombre: "Acme S.A.",
            Nit: "900123456-1",
            Telefono: "3001234567",
            Ciudad: new string('C', 101)
        );

        // WHEN
        var result = _validator.TestValidate(request);

        // THEN: Validation error on Ciudad
        result.ShouldHaveValidationErrorFor(x => x.Ciudad);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // All fields invalid simultaneously — all four errors reported at once
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P3] All four fields null simultaneously — all four validation errors reported.
    /// </summary>
    [Fact]
    public void Validate_WhenAllFieldsAreNull_ShouldHaveValidationErrorsForAllFields()
    {
        // GIVEN: All four fields null
        var request = new CreateClienteRequest(
            Nombre: null!,
            Nit: null!,
            Telefono: null!,
            Ciudad: null!
        );

        // WHEN
        var result = _validator.TestValidate(request);

        // THEN: Validation errors on all four fields
        result.ShouldHaveValidationErrorFor(x => x.Nombre);
        result.ShouldHaveValidationErrorFor(x => x.Nit);
        result.ShouldHaveValidationErrorFor(x => x.Telefono);
        result.ShouldHaveValidationErrorFor(x => x.Ciudad);
    }

    /// <summary>
    /// [P3] All four fields empty string simultaneously — all four validation errors reported.
    /// </summary>
    [Fact]
    public void Validate_WhenAllFieldsAreEmpty_ShouldHaveValidationErrorsForAllFields()
    {
        // GIVEN: All four fields empty string
        var request = new CreateClienteRequest(
            Nombre: string.Empty,
            Nit: string.Empty,
            Telefono: string.Empty,
            Ciudad: string.Empty
        );

        // WHEN
        var result = _validator.TestValidate(request);

        // THEN: Validation errors on all four fields
        result.ShouldHaveValidationErrorFor(x => x.Nombre);
        result.ShouldHaveValidationErrorFor(x => x.Nit);
        result.ShouldHaveValidationErrorFor(x => x.Telefono);
        result.ShouldHaveValidationErrorFor(x => x.Ciudad);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Minimum boundary: single-character values pass validation
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P3] Single-character values for all fields pass validation (min(1) boundary).
    /// </summary>
    [Fact]
    public void Validate_WhenAllFieldsAreSingleCharacter_ShouldNotHaveAnyValidationErrors()
    {
        // GIVEN: All fields at single character (minimum valid length)
        var request = new CreateClienteRequest(
            Nombre: "A",
            Nit: "1",
            Telefono: "3",
            Ciudad: "B"
        );

        // WHEN
        var result = _validator.TestValidate(request);

        // THEN: No validation errors
        result.ShouldNotHaveAnyValidationErrors();
    }
}
