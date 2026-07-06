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
}
