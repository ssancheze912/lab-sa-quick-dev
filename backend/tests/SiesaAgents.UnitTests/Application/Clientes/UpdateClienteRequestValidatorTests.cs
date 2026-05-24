using FluentValidation.TestHelper;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Validators;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Edge case and boundary condition tests for UpdateClienteRequestValidator.
/// Story 1.1 — Project Initialization &amp; Repository Structure
/// </summary>
public class UpdateClienteRequestValidatorTests
{
    private readonly UpdateClienteRequestValidator _validator = new();

    // ─────────────────────────────────────────────────────────────────────────
    // Happy path
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Validate_WithValidRequest_PassesAllRules()
    {
        // GIVEN: A valid update request
        var request = new UpdateClienteRequest("Empresa Actualizada", "+57 300 0000", "Cali");

        // WHEN: The validator runs
        var result = _validator.TestValidate(request);

        // THEN: No validation errors
        result.ShouldNotHaveAnyValidationErrors();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Nombre — required
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Validate_WithEmptyNombre_FailsNombreRule()
    {
        // GIVEN: Empty nombre on update
        var request = new UpdateClienteRequest("", null, null);

        // WHEN: The validator runs
        var result = _validator.TestValidate(request);

        // THEN: Nombre validation fails — you cannot update to an empty name
        result.ShouldHaveValidationErrorFor(x => x.Nombre);
    }

    [Fact]
    public void Validate_WithNombreExceeding200Chars_FailsMaxLengthRule()
    {
        // GIVEN: A nombre of 201 characters
        var nombre = new string('Z', 201);
        var request = new UpdateClienteRequest(nombre, null, null);

        // WHEN: The validator runs
        var result = _validator.TestValidate(request);

        // THEN: Max-length rule fails (boundary: 200)
        result.ShouldHaveValidationErrorFor(x => x.Nombre);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Optional fields — when null, length rules are skipped
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Validate_WithNullOptionalFields_NoErrors()
    {
        // GIVEN: Only nombre is provided (optional fields cleared to null)
        var request = new UpdateClienteRequest("Empresa", null, null);

        // WHEN: The validator runs
        var result = _validator.TestValidate(request);

        // THEN: No errors — When(x => x.Telefono is not null) skips length checks
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Validate_WithTelefonoExceeding50Chars_FailsMaxLengthRule()
    {
        // GIVEN: A Telefono string of 51 characters
        var telefono = new string('5', 51);
        var request = new UpdateClienteRequest("Empresa", telefono, null);

        // WHEN: The validator runs
        var result = _validator.TestValidate(request);

        // THEN: Telefono max-length validation fails
        result.ShouldHaveValidationErrorFor(x => x.Telefono);
    }

    [Fact]
    public void Validate_WithCiudadExceeding100Chars_FailsMaxLengthRule()
    {
        // GIVEN: A Ciudad string of 101 characters
        var ciudad = new string('C', 101);
        var request = new UpdateClienteRequest("Empresa", null, ciudad);

        // WHEN: The validator runs
        var result = _validator.TestValidate(request);

        // THEN: Ciudad max-length validation fails
        result.ShouldHaveValidationErrorFor(x => x.Ciudad);
    }
}
