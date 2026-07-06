using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Validators;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Story 2.4 (Epic 2: Client Management), AC #3 — ATDD Acceptance Tests, RED phase.
///
/// RED phase: fails to compile today because <c>UpdateClienteRequest</c> and
/// <c>UpdateClienteRequestValidator</c> do not exist yet (Story 2.4 Task 2). Mirrors
/// <c>CreateClienteRequestValidatorTests.cs</c>'s structure exactly — per Story 2.4 Task 2's
/// explicit instruction, the <c>MaximumLength</c> rules (200/50/30/100) must be present from
/// the start this time, since Story 2.3 only added them in its code-review round after
/// `testarch-automate` found the gap.
///
/// Covers the server-side half of AC #3's "no empty required field on edit" defense (the
/// client-side half is the same shared Zod `clienteSchema.ts` used for create, out of scope
/// for this backend suite).
/// </summary>
public class UpdateClienteRequestValidatorTests
{
    private readonly UpdateClienteRequestValidator _validator = new();

    private static UpdateClienteRequest ValidRequest() =>
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
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateClienteRequest.Nombre));
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
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateClienteRequest.Nit));
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
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateClienteRequest.Telefono));
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
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateClienteRequest.Ciudad));
    }

    // ── MaximumLength coverage (present from the start — Story 2.3's post-review lesson) ───

    [Fact]
    public void Validate_Fails_WhenNombreExceedsMaxLength()
    {
        // GIVEN a Nombre one character past the 200-character DB column limit
        var request = ValidRequest() with { Nombre = new string('A', 201) };

        // WHEN the request is validated
        var result = _validator.Validate(request);

        // THEN validation fails on the Nombre property
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateClienteRequest.Nombre));
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
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateClienteRequest.Nit));
    }

    [Fact]
    public void Validate_Fails_WhenTelefonoExceedsMaxLength()
    {
        // GIVEN a Telefono one character past the 30-character DB column limit
        var request = ValidRequest() with { Telefono = new string('3', 31) };

        // WHEN the request is validated
        var result = _validator.Validate(request);

        // THEN validation fails on the Telefono property
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateClienteRequest.Telefono));
    }

    [Fact]
    public void Validate_Fails_WhenCiudadExceedsMaxLength()
    {
        // GIVEN a Ciudad one character past the 100-character DB column limit
        var request = ValidRequest() with { Ciudad = new string('B', 101) };

        // WHEN the request is validated
        var result = _validator.Validate(request);

        // THEN validation fails on the Ciudad property
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateClienteRequest.Ciudad));
    }

    [Fact]
    public void Validate_Fails_WithOneErrorPerField_WhenAllFourFieldsAreEmpty()
    {
        // GIVEN a request where every required field is empty simultaneously
        var request = new UpdateClienteRequest(string.Empty, string.Empty, string.Empty, string.Empty);

        // WHEN the request is validated
        var result = _validator.Validate(request);

        // THEN validation reports exactly one error per field — no cross-field interference
        Assert.False(result.IsValid);
        Assert.Equal(4, result.Errors.Count);
    }
}
