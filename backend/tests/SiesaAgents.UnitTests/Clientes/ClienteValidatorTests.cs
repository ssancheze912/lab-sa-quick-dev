using SiesaAgents.Application.Clientes.Validators;
using Xunit;

namespace SiesaAgents.UnitTests.Clientes;

/// <summary>
/// Unit tests — Story 2.1: CreateClienteRequestValidator (FluentValidation)
/// Test IDs covered:
///   P2 — Validator rejects null/empty Nombre
///   P2 — Validator rejects null/empty NIT
///   P2 — Validator rejects null/empty Telefono
///   P2 — Validator rejects null/empty Ciudad
/// </summary>
public class ClienteValidatorTests
{
    private readonly CreateClienteRequestValidator _validator = new();

    // ─────────────────────────────────────────────────────────────────────────
    // P2 — Rejects empty Nombre
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Validate_WhenNombreIsEmpty_FailsValidation()
    {
        // GIVEN: Request with empty Nombre
        var request = new CreateClienteRequest(
            Nombre: "",
            Nit: "900123456-1",
            Telefono: "3001234567",
            Ciudad: "Bogotá");

        // WHEN: Validated
        var result = _validator.Validate(request);

        // THEN: Validation fails with error on Nombre
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateClienteRequest.Nombre));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // P2 — Rejects empty NIT
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Validate_WhenNitIsEmpty_FailsValidation()
    {
        // GIVEN: Request with empty NIT
        var request = new CreateClienteRequest(
            Nombre: "Acme S.A.",
            Nit: "",
            Telefono: "3001234567",
            Ciudad: "Bogotá");

        // WHEN: Validated
        var result = _validator.Validate(request);

        // THEN: Validation fails with error on Nit
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateClienteRequest.Nit));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // P2 — Rejects empty Telefono
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Validate_WhenTelefonoIsEmpty_FailsValidation()
    {
        // GIVEN: Request with empty Telefono
        var request = new CreateClienteRequest(
            Nombre: "Acme S.A.",
            Nit: "900123456-1",
            Telefono: "",
            Ciudad: "Bogotá");

        // WHEN: Validated
        var result = _validator.Validate(request);

        // THEN: Validation fails with error on Telefono
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateClienteRequest.Telefono));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // P2 — Rejects empty Ciudad
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Validate_WhenCiudadIsEmpty_FailsValidation()
    {
        // GIVEN: Request with empty Ciudad
        var request = new CreateClienteRequest(
            Nombre: "Acme S.A.",
            Nit: "900123456-1",
            Telefono: "3001234567",
            Ciudad: "");

        // WHEN: Validated
        var result = _validator.Validate(request);

        // THEN: Validation fails with error on Ciudad
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateClienteRequest.Ciudad));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Passes with valid data
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Validate_WhenAllFieldsAreValid_PassesValidation()
    {
        // GIVEN: A fully valid request
        var request = new CreateClienteRequest(
            Nombre: "Acme S.A.",
            Nit: "900123456-1",
            Telefono: "3001234567",
            Ciudad: "Bogotá");

        // WHEN: Validated
        var result = _validator.Validate(request);

        // THEN: Validation passes
        Assert.True(result.IsValid);
    }
}
