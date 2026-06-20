// ─────────────────────────────────────────────────────────────────────────────
// Story 2.3: Create Client — FluentValidation Unit Tests
// Test Level: Unit (xUnit)
//
// Acceptance Criteria covered:
//   AC3 — Validation fails for each empty required field independently
//
// Pattern: Arrange / Act / Assert (AAA)
// ─────────────────────────────────────────────────────────────────────────────

using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Validators;
using Xunit;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Unit tests for CreateClienteRequestValidator.
/// Validates each required field independently to confirm FluentValidation rules.
/// </summary>
public class CreateClienteRequestValidatorTests
{
    private readonly CreateClienteRequestValidator _validator = new();

    // ──────────────────────────────────────────────────────────────────────────
    // Valid request passes validation
    // ──────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "Valid request with all fields populated passes validation")]
    public void Validate_AllFieldsFilled_IsValid()
    {
        // ARRANGE
        var request = new CreateClienteRequest("Empresa Válida", "900111222-1", "3001234567", "Bogotá");

        // ACT
        var result = _validator.Validate(request);

        // ASSERT
        Assert.True(result.IsValid);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Nombre validation
    // ──────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "AC3 — Empty Nombre fails validation")]
    public void Validate_EmptyNombre_IsInvalid()
    {
        // ARRANGE
        var request = new CreateClienteRequest("", "900111222-1", "3001234567", "Bogotá");

        // ACT
        var result = _validator.Validate(request);

        // ASSERT
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Nombre");
    }

    [Fact(DisplayName = "AC3 — Whitespace-only Nombre fails validation")]
    public void Validate_WhitespaceNombre_IsInvalid()
    {
        // ARRANGE
        var request = new CreateClienteRequest("   ", "900111222-1", "3001234567", "Bogotá");

        // ACT
        var result = _validator.Validate(request);

        // ASSERT
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Nombre");
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Nit validation
    // ──────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "AC3 — Empty Nit fails validation")]
    public void Validate_EmptyNit_IsInvalid()
    {
        // ARRANGE
        var request = new CreateClienteRequest("Empresa Test", "", "3001234567", "Bogotá");

        // ACT
        var result = _validator.Validate(request);

        // ASSERT
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Nit");
    }

    [Fact(DisplayName = "AC3 — Nit error message is 'El NIT no puede estar vacío'")]
    public void Validate_EmptyNit_HasCorrectErrorMessage()
    {
        // ARRANGE
        var request = new CreateClienteRequest("Empresa Test", "", "3001234567", "Bogotá");

        // ACT
        var result = _validator.Validate(request);

        // ASSERT
        var nitError = result.Errors.FirstOrDefault(e => e.PropertyName == "Nit");
        Assert.NotNull(nitError);
        Assert.Equal("El NIT no puede estar vacío", nitError.ErrorMessage);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Telefono validation
    // ──────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "AC3 — Empty Telefono fails validation")]
    public void Validate_EmptyTelefono_IsInvalid()
    {
        // ARRANGE
        var request = new CreateClienteRequest("Empresa Test", "900111222-1", "", "Bogotá");

        // ACT
        var result = _validator.Validate(request);

        // ASSERT
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Telefono");
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Ciudad validation
    // ──────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "AC3 — Empty Ciudad fails validation")]
    public void Validate_EmptyCiudad_IsInvalid()
    {
        // ARRANGE
        var request = new CreateClienteRequest("Empresa Test", "900111222-1", "3001234567", "");

        // ACT
        var result = _validator.Validate(request);

        // ASSERT
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Ciudad");
    }

    [Fact(DisplayName = "AC3 — All fields empty produces 4 validation errors")]
    public void Validate_AllFieldsEmpty_Has4Errors()
    {
        // ARRANGE
        var request = new CreateClienteRequest("", "", "", "");

        // ACT
        var result = _validator.Validate(request);

        // ASSERT: One error per required field
        Assert.False(result.IsValid);
        Assert.Equal(4, result.Errors.Count);
    }
}
