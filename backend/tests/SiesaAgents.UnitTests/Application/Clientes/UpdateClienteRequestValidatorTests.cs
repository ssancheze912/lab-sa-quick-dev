// ─────────────────────────────────────────────────────────────────────────────
// ATDD — Story 2.4: Edit Client
// Test Level: Unit (xUnit + FluentValidation)
// Phase: GREEN — tests pass with UpdateClienteRequestValidator implementation
//
// Acceptance Criteria covered:
//   AC3 — Validator fails for each empty required field independently
//
// Pattern: Arrange / Act / Assert (AAA)
// ─────────────────────────────────────────────────────────────────────────────

using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Validators;
using Xunit;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Unit tests for UpdateClienteRequestValidator.
/// Validates that each required field independently triggers an error when empty.
/// </summary>
public class UpdateClienteRequestValidatorTests
{
    private readonly UpdateClienteRequestValidator _validator = new();

    // ──────────────────────────────────────────────────────────────────────────
    // Valid request — passes all rules
    // ──────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "Valid request with all fields populated passes validation")]
    public async Task Validate_AllFieldsPopulated_IsValid()
    {
        // ARRANGE
        var request = new UpdateClienteRequest("Empresa Test", "900111222-1", "3001234567", "Bogotá");

        // ACT
        var result = await _validator.ValidateAsync(request);

        // ASSERT
        Assert.True(result.IsValid);
        Assert.Empty(result.Errors);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // AC3 — Nombre is required
    // ──────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "AC3 — Validator fails when Nombre is empty")]
    public async Task Validate_EmptyNombre_FailsWithMessage()
    {
        // ARRANGE
        var request = new UpdateClienteRequest("", "900111222-1", "3001234567", "Bogotá");

        // ACT
        var result = await _validator.ValidateAsync(request);

        // ASSERT
        Assert.False(result.IsValid);
        var error = Assert.Single(result.Errors, e => e.PropertyName == "Nombre");
        Assert.Equal("Este campo es requerido", error.ErrorMessage);
    }

    [Fact(DisplayName = "AC3 — Validator fails when Nombre is whitespace-only")]
    public async Task Validate_WhitespaceNombre_FailsWithMessage()
    {
        // ARRANGE
        var request = new UpdateClienteRequest("   ", "900111222-1", "3001234567", "Bogotá");

        // ACT
        var result = await _validator.ValidateAsync(request);

        // ASSERT
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Nombre");
    }

    // ──────────────────────────────────────────────────────────────────────────
    // AC3 — Nit is required
    // ──────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "AC3 — Validator fails when Nit is empty")]
    public async Task Validate_EmptyNit_FailsWithMessage()
    {
        // ARRANGE
        var request = new UpdateClienteRequest("Empresa Test", "", "3001234567", "Bogotá");

        // ACT
        var result = await _validator.ValidateAsync(request);

        // ASSERT
        Assert.False(result.IsValid);
        var error = Assert.Single(result.Errors, e => e.PropertyName == "Nit");
        Assert.Equal("El NIT no puede estar vacío", error.ErrorMessage);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // AC3 — Telefono is required
    // ──────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "AC3 — Validator fails when Telefono is empty")]
    public async Task Validate_EmptyTelefono_FailsWithMessage()
    {
        // ARRANGE
        var request = new UpdateClienteRequest("Empresa Test", "900111222-1", "", "Bogotá");

        // ACT
        var result = await _validator.ValidateAsync(request);

        // ASSERT
        Assert.False(result.IsValid);
        var error = Assert.Single(result.Errors, e => e.PropertyName == "Telefono");
        Assert.Equal("Este campo es requerido", error.ErrorMessage);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // AC3 — Ciudad is required
    // ──────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "AC3 — Validator fails when Ciudad is empty")]
    public async Task Validate_EmptyCiudad_FailsWithMessage()
    {
        // ARRANGE
        var request = new UpdateClienteRequest("Empresa Test", "900111222-1", "3001234567", "");

        // ACT
        var result = await _validator.ValidateAsync(request);

        // ASSERT
        Assert.False(result.IsValid);
        var error = Assert.Single(result.Errors, e => e.PropertyName == "Ciudad");
        Assert.Equal("Este campo es requerido", error.ErrorMessage);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // AC3 — Multiple empty fields fail independently
    // ──────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "AC3 — Validator reports all four field errors when all fields are empty")]
    public async Task Validate_AllFieldsEmpty_ReportsAllErrors()
    {
        // ARRANGE
        var request = new UpdateClienteRequest("", "", "", "");

        // ACT
        var result = await _validator.ValidateAsync(request);

        // ASSERT: Four errors, one per required field
        Assert.False(result.IsValid);
        Assert.Equal(4, result.Errors.Count);
        Assert.Contains(result.Errors, e => e.PropertyName == "Nombre");
        Assert.Contains(result.Errors, e => e.PropertyName == "Nit");
        Assert.Contains(result.Errors, e => e.PropertyName == "Telefono");
        Assert.Contains(result.Errors, e => e.PropertyName == "Ciudad");
    }
}
