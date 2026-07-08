using FluentValidation.TestHelper;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Validators;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Story 2.4 — ATDD (RED phase).
///
/// Contract tests for <c>UpdateClienteRequestValidator</c> (Task 3). Covers:
///   * AC #10 — Presence rules: null, empty, and whitespace-only values MUST
///              produce validation errors.
///   * R-006  — Spanish messages MUST be byte-for-byte identical to the Story
///              2.3 <c>CreateClienteRequestValidator</c> AND to the frontend
///              Zod schema (Zod ↔ FluentValidation parity). Copy-paste the
///              constants — do NOT introduce a shared string helper: the
///              drift-anchor lives IN the duplicate so any of the four sides
///              (frontend Zod, CreateValidator, UpdateValidator, endpoint
///              tests) breaking first is exactly what we want.
///
/// RED until:
///   - SiesaAgents.Application.Clientes.DTOs.UpdateClienteRequest
///   - SiesaAgents.Application.Clientes.Validators.UpdateClienteRequestValidator
/// exist.
/// </summary>
public sealed class UpdateClienteRequestValidatorTests
{
    // Hand-copied constants — MUST match CreateClienteRequestValidatorTests verbatim.
    private const string NombreMessage = "El nombre es obligatorio";
    private const string NitMessage = "El NIT/RUC es obligatorio";
    private const string TelefonoMessage = "El teléfono es obligatorio";
    private const string CiudadMessage = "La ciudad es obligatoria";

    private static UpdateClienteRequest ValidRequest() =>
        new("Acme SAS", "900123456", "3001234567", "Cali");

    private static readonly UpdateClienteRequestValidator _validator = new();

    // ─── Happy path ──────────────────────────────────────────────────────

    [Fact]
    public void Validate_Passes_WhenAllFieldsPresent()
    {
        var result = _validator.TestValidate(ValidRequest());
        result.ShouldNotHaveAnyValidationErrors();
    }

    // ─── Nombre ──────────────────────────────────────────────────────────

    [Fact]
    public void Validate_Fails_WithSpanishMessage_WhenNombreIsNull()
    {
        var result = _validator.TestValidate(ValidRequest() with { Nombre = null! });
        result.ShouldHaveValidationErrorFor(x => x.Nombre).WithErrorMessage(NombreMessage);
    }

    [Fact]
    public void Validate_Fails_WithSpanishMessage_WhenNombreIsEmpty()
    {
        var result = _validator.TestValidate(ValidRequest() with { Nombre = "" });
        result.ShouldHaveValidationErrorFor(x => x.Nombre).WithErrorMessage(NombreMessage);
    }

    [Fact]
    public void Validate_Fails_WithSpanishMessage_WhenNombreIsWhitespace()
    {
        var result = _validator.TestValidate(ValidRequest() with { Nombre = "   " });
        result.ShouldHaveValidationErrorFor(x => x.Nombre).WithErrorMessage(NombreMessage);
    }

    // ─── NIT ─────────────────────────────────────────────────────────────

    [Fact]
    public void Validate_Fails_WithSpanishMessage_WhenNitIsNull()
    {
        var result = _validator.TestValidate(ValidRequest() with { Nit = null! });
        result.ShouldHaveValidationErrorFor(x => x.Nit).WithErrorMessage(NitMessage);
    }

    [Fact]
    public void Validate_Fails_WithSpanishMessage_WhenNitIsEmpty()
    {
        var result = _validator.TestValidate(ValidRequest() with { Nit = "" });
        result.ShouldHaveValidationErrorFor(x => x.Nit).WithErrorMessage(NitMessage);
    }

    [Fact]
    public void Validate_Fails_WithSpanishMessage_WhenNitIsWhitespace()
    {
        var result = _validator.TestValidate(ValidRequest() with { Nit = "   " });
        result.ShouldHaveValidationErrorFor(x => x.Nit).WithErrorMessage(NitMessage);
    }

    // ─── Teléfono ────────────────────────────────────────────────────────

    [Fact]
    public void Validate_Fails_WithSpanishMessage_WhenTelefonoIsEmpty()
    {
        var result = _validator.TestValidate(ValidRequest() with { Telefono = "" });
        result.ShouldHaveValidationErrorFor(x => x.Telefono).WithErrorMessage(TelefonoMessage);
    }

    [Fact]
    public void Validate_Fails_WithSpanishMessage_WhenTelefonoIsWhitespace()
    {
        var result = _validator.TestValidate(ValidRequest() with { Telefono = "   " });
        result.ShouldHaveValidationErrorFor(x => x.Telefono).WithErrorMessage(TelefonoMessage);
    }

    // ─── Ciudad ──────────────────────────────────────────────────────────

    [Fact]
    public void Validate_Fails_WithSpanishMessage_WhenCiudadIsEmpty()
    {
        var result = _validator.TestValidate(ValidRequest() with { Ciudad = "" });
        result.ShouldHaveValidationErrorFor(x => x.Ciudad).WithErrorMessage(CiudadMessage);
    }

    [Fact]
    public void Validate_Fails_WithSpanishMessage_WhenCiudadIsWhitespace()
    {
        var result = _validator.TestValidate(ValidRequest() with { Ciudad = "   " });
        result.ShouldHaveValidationErrorFor(x => x.Ciudad).WithErrorMessage(CiudadMessage);
    }

    // ─── Multi-field failure ─────────────────────────────────────────────

    // AC #10 — all four fields empty produces four errors (one per field).
    [Fact]
    public void Validate_ReportsAllFourErrors_WhenAllFieldsAreEmpty()
    {
        var result = _validator.TestValidate(new UpdateClienteRequest("", "", "", ""));

        result.ShouldHaveValidationErrorFor(x => x.Nombre).WithErrorMessage(NombreMessage);
        result.ShouldHaveValidationErrorFor(x => x.Nit).WithErrorMessage(NitMessage);
        result.ShouldHaveValidationErrorFor(x => x.Telefono).WithErrorMessage(TelefonoMessage);
        result.ShouldHaveValidationErrorFor(x => x.Ciudad).WithErrorMessage(CiudadMessage);
    }
}
