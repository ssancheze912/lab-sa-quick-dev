using FluentValidation.TestHelper;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Validators;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Edge case and boundary condition tests for CreateClienteRequestValidator.
/// Story 1.1 — Project Initialization &amp; Repository Structure
/// Tests FluentValidation rules on the Application layer boundary.
/// </summary>
public class CreateClienteRequestValidatorTests
{
    private readonly CreateClienteRequestValidator _validator = new();

    // ─────────────────────────────────────────────────────────────────────────
    // Happy path
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Validate_WithValidRequest_PassesAllRules()
    {
        // GIVEN: A fully valid CreateClienteRequest
        var request = new CreateClienteRequest("Empresa ABC", "900123456-1", "+57 300 0000", "Bogotá");

        // WHEN: The validator runs
        var result = _validator.TestValidate(request);

        // THEN: No validation errors
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Validate_WithNullOptionalFields_PassesAllRules()
    {
        // GIVEN: A request with only required fields
        var request = new CreateClienteRequest("Empresa", "900-1", null, null);

        // WHEN: The validator runs
        var result = _validator.TestValidate(request);

        // THEN: No errors — optional fields are allowed to be null
        result.ShouldNotHaveAnyValidationErrors();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Nombre — required, bounded
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Validate_WithEmptyNombre_FailsNombreRule()
    {
        // GIVEN: Empty nombre
        var request = new CreateClienteRequest("", "900-1", null, null);

        // WHEN: The validator runs
        var result = _validator.TestValidate(request);

        // THEN: Nombre validation fails
        result.ShouldHaveValidationErrorFor(x => x.Nombre);
    }

    [Fact]
    public void Validate_WithNombreExceeding200Chars_FailsMaxLengthRule()
    {
        // GIVEN: A nombre string of 201 characters (boundary: max is 200)
        var nombre = new string('A', 201);
        var request = new CreateClienteRequest(nombre, "900-1", null, null);

        // WHEN: The validator runs
        var result = _validator.TestValidate(request);

        // THEN: Nombre max-length validation fails
        result.ShouldHaveValidationErrorFor(x => x.Nombre);
    }

    [Fact]
    public void Validate_WithNombreExactly200Chars_Passes()
    {
        // GIVEN: A nombre string of exactly 200 characters (boundary: max is 200)
        var nombre = new string('A', 200);
        var request = new CreateClienteRequest(nombre, "900-1", null, null);

        // WHEN: The validator runs
        var result = _validator.TestValidate(request);

        // THEN: Nombre max-length rule is satisfied (inclusive boundary)
        result.ShouldNotHaveValidationErrorFor(x => x.Nombre);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Nit — required, bounded
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Validate_WithEmptyNit_FailsNitRule()
    {
        // GIVEN: Empty NIT
        var request = new CreateClienteRequest("Empresa", "", null, null);

        // WHEN: The validator runs
        var result = _validator.TestValidate(request);

        // THEN: Nit validation fails
        result.ShouldHaveValidationErrorFor(x => x.Nit);
    }

    [Fact]
    public void Validate_WithNitExceeding50Chars_FailsMaxLengthRule()
    {
        // GIVEN: A NIT string of 51 characters (boundary: max is 50)
        var nit = new string('9', 51);
        var request = new CreateClienteRequest("Empresa", nit, null, null);

        // WHEN: The validator runs
        var result = _validator.TestValidate(request);

        // THEN: Nit max-length validation fails
        result.ShouldHaveValidationErrorFor(x => x.Nit);
    }

    [Fact]
    public void Validate_WithNitExactly50Chars_Passes()
    {
        // GIVEN: A NIT string of exactly 50 characters (inclusive boundary)
        var nit = new string('9', 50);
        var request = new CreateClienteRequest("Empresa", nit, null, null);

        // WHEN: The validator runs
        var result = _validator.TestValidate(request);

        // THEN: Nit max-length rule is satisfied
        result.ShouldNotHaveValidationErrorFor(x => x.Nit);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Telefono — optional, max 50
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Validate_WithTelefonoExceeding50Chars_FailsMaxLengthRule()
    {
        // GIVEN: A Telefono string of 51 characters
        var telefono = new string('1', 51);
        var request = new CreateClienteRequest("Empresa", "900-1", telefono, null);

        // WHEN: The validator runs
        var result = _validator.TestValidate(request);

        // THEN: Telefono max-length validation fails
        result.ShouldHaveValidationErrorFor(x => x.Telefono);
    }

    [Fact]
    public void Validate_WithTelefonoNull_DoesNotValidateTelefonoLength()
    {
        // GIVEN: Telefono is null (skips MaximumLength rule per When clause)
        var request = new CreateClienteRequest("Empresa", "900-1", null, null);

        // WHEN: The validator runs
        var result = _validator.TestValidate(request);

        // THEN: No Telefono validation errors — When(x => x.Telefono is not null) skips the rule
        result.ShouldNotHaveValidationErrorFor(x => x.Telefono);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Ciudad — optional, max 100
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Validate_WithCiudadExceeding100Chars_FailsMaxLengthRule()
    {
        // GIVEN: A Ciudad string of 101 characters
        var ciudad = new string('B', 101);
        var request = new CreateClienteRequest("Empresa", "900-1", null, ciudad);

        // WHEN: The validator runs
        var result = _validator.TestValidate(request);

        // THEN: Ciudad max-length validation fails
        result.ShouldHaveValidationErrorFor(x => x.Ciudad);
    }

    [Fact]
    public void Validate_WithCiudadNull_DoesNotValidateCiudadLength()
    {
        // GIVEN: Ciudad is null (skips MaximumLength rule per When clause)
        var request = new CreateClienteRequest("Empresa", "900-1", null, null);

        // WHEN: The validator runs
        var result = _validator.TestValidate(request);

        // THEN: No Ciudad validation errors
        result.ShouldNotHaveValidationErrorFor(x => x.Ciudad);
    }
}
