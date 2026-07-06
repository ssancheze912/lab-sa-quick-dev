using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Validators;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Story 2.3 (Epic 2: Client Management), AC #3 — ATDD Acceptance Tests, RED phase.
///
/// RED phase: fails to compile today because <c>CreateClienteRequest</c> and
/// <c>CreateClienteRequestValidator</c> do not exist yet (Story 2.3 Task 1). Mirrors
/// <c>GetClientesQueryHandlerTests.cs</c>/<c>GetClienteByIdQueryHandlerTests.cs</c>'s
/// no-mocking-framework convention.
///
/// Covers TC-E2-P2-06: FluentValidation's <c>NotEmpty()</c> must reject empty AND
/// whitespace-only values independently for each of the four required fields, and accept a
/// fully valid request — the server-side half of AC #3's "no empty required field" defense
/// (the client-side half is Zod's `clienteSchema.ts`, out of scope for this backend suite).
/// </summary>
public class CreateClienteRequestValidatorTests
{
    private readonly CreateClienteRequestValidator _validator = new();

    private static CreateClienteRequest ValidRequest() =>
        new("Acme Corp", "900123456", "3001234567", "Bogotá");

    [Fact]
    public void Validate_Succeeds_WhenAllFieldsAreValid()
    {
        // GIVEN a request with all four required fields populated
        var request = ValidRequest();

        // WHEN the request is validated
        var result = _validator.Validate(request);

        // THEN validation succeeds with no errors
        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Validate_Fails_WhenNombreIsEmptyOrWhitespace(string nombre)
    {
        // GIVEN a request whose Nombre is empty or whitespace-only
        var request = ValidRequest() with { Nombre = nombre };

        // WHEN the request is validated
        var result = _validator.Validate(request);

        // THEN validation fails on the Nombre property
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateClienteRequest.Nombre));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Validate_Fails_WhenNitIsEmptyOrWhitespace(string nit)
    {
        // GIVEN a request whose Nit is empty or whitespace-only
        var request = ValidRequest() with { Nit = nit };

        // WHEN the request is validated
        var result = _validator.Validate(request);

        // THEN validation fails on the Nit property
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateClienteRequest.Nit));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Validate_Fails_WhenTelefonoIsEmptyOrWhitespace(string telefono)
    {
        // GIVEN a request whose Telefono is empty or whitespace-only
        var request = ValidRequest() with { Telefono = telefono };

        // WHEN the request is validated
        var result = _validator.Validate(request);

        // THEN validation fails on the Telefono property
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateClienteRequest.Telefono));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Validate_Fails_WhenCiudadIsEmptyOrWhitespace(string ciudad)
    {
        // GIVEN a request whose Ciudad is empty or whitespace-only
        var request = ValidRequest() with { Ciudad = ciudad };

        // WHEN the request is validated
        var result = _validator.Validate(request);

        // THEN validation fails on the Ciudad property
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateClienteRequest.Ciudad));
    }

    // ── Test Automation Expansion (testarch-automate) — edge cases beyond ATDD ─────────────

    [Fact]
    public void Validate_Fails_WithOneErrorPerField_WhenAllFourFieldsAreEmpty()
    {
        // GIVEN a request where every required field is empty simultaneously (not just one
        // at a time, as the ATDD suite above exercises independently)
        var request = new CreateClienteRequest(string.Empty, string.Empty, string.Empty, string.Empty);

        // WHEN the request is validated
        var result = _validator.Validate(request);

        // THEN validation reports exactly one error per field — no cross-field interference
        // and no duplicate errors for the same property
        Assert.False(result.IsValid);
        Assert.Equal(4, result.Errors.Count);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateClienteRequest.Nombre));
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateClienteRequest.Nit));
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateClienteRequest.Telefono));
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateClienteRequest.Ciudad));
    }

    [Fact]
    public void Validate_Fails_OnlyOnNombre_WhenOnlyNombreIsEmptyAndOthersAreValid()
    {
        // GIVEN a request where only Nombre is blank and the other three fields are valid
        var request = ValidRequest() with { Nombre = "   " };

        // WHEN the request is validated
        var result = _validator.Validate(request);

        // THEN exactly one error is reported, scoped to Nombre only — a blank field never
        // triggers a false-positive error on a sibling field
        var error = Assert.Single(result.Errors);
        Assert.Equal(nameof(CreateClienteRequest.Nombre), error.PropertyName);
    }

    [Fact]
    public void Validate_Succeeds_WhenFieldsContainLeadingOrTrailingWhitespaceAroundValidText()
    {
        // GIVEN a request whose fields have surrounding whitespace but non-blank content
        // (the backend validator does not trim; it only rejects fully empty/whitespace values)
        var request = new CreateClienteRequest("  Acme Corp  ", " 900123456 ", " 3001234567 ", " Bogotá ");

        // WHEN the request is validated
        var result = _validator.Validate(request);

        // THEN validation succeeds — NotEmpty only rejects blank strings, not padded ones
        Assert.True(result.IsValid);
    }

    // ── MaximumLength coverage (code-review finding) ────────────────────────────────────────
    // testarch-automate's integration suite documented that neither this validator nor
    // `clienteSchema.ts` enforced the DB's `ClienteConfiguration.HasMaxLength` limits
    // (200/50/30/100), so an over-length submission only failed once it hit the database's
    // `character varying` constraint (a generic 500 via `ExceptionHandlingMiddleware` instead
    // of a clean 400). These tests lock in the fix at the unit level, mirroring each field's
    // configured limit.

    [Fact]
    public void Validate_Fails_WhenNombreExceedsMaxLength()
    {
        // GIVEN a Nombre one character past the 200-character DB column limit
        var request = ValidRequest() with { Nombre = new string('A', 201) };

        // WHEN the request is validated
        var result = _validator.Validate(request);

        // THEN validation fails on the Nombre property
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateClienteRequest.Nombre));
    }

    [Fact]
    public void Validate_Succeeds_WhenNombreIsExactlyAtMaxLength()
    {
        // GIVEN a Nombre exactly at the 200-character DB column limit
        var request = ValidRequest() with { Nombre = new string('A', 200) };

        // WHEN the request is validated
        var result = _validator.Validate(request);

        // THEN validation succeeds — the boundary value fits exactly
        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validate_Fails_WhenNitExceedsMaxLength()
    {
        // GIVEN a Nit one character past the 50-character DB column limit
        var request = ValidRequest() with { Nit = new string('9', 51) };

        // WHEN the request is validated
        var result = _validator.Validate(request);

        // THEN validation fails on the Nit property
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateClienteRequest.Nit));
    }

    [Fact]
    public void Validate_Fails_WhenTelefonoExceedsMaxLength()
    {
        // GIVEN a Telefono one character past the 30-character DB column limit
        var request = ValidRequest() with { Telefono = new string('3', 31) };

        // WHEN the request is validated
        var result = _validator.Validate(request);

        // THEN validation fails on the Telefono property
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateClienteRequest.Telefono));
    }

    [Fact]
    public void Validate_Fails_WhenCiudadExceedsMaxLength()
    {
        // GIVEN a Ciudad one character past the 100-character DB column limit
        var request = ValidRequest() with { Ciudad = new string('B', 101) };

        // WHEN the request is validated
        var result = _validator.Validate(request);

        // THEN validation fails on the Ciudad property
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateClienteRequest.Ciudad));
    }
}
