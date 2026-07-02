// -----------------------------------------------------------------------------
//  Story 2.3 — Create Client (BMad-Integrated automate expansion)
//  Boundary + edge-case tests for CreateClienteRequestValidator.
//
//  Complements CreateClienteRequestValidatorTests.cs (which covers happy path,
//  empty, whitespace, and 51/101/201-char overflow) with paths the baseline
//  does not:
//    - Exactly-at-max lengths (200 / 50 / 50 / 100) must PASS.
//    - Length + required errors are reported together, not short-circuited.
//    - Special characters (accented, XSS-like, injection-like) do NOT trip the
//      validator — its contract is length + required only; content policy is
//      the domain entity's responsibility, escaping is the renderer's.
//    - Trim happens server-side in ClienteEntity.Create, NOT the validator —
//      pre-trim whitespace of a value that is still non-empty after the
//      surrounding trim still passes .NotEmpty().
// -----------------------------------------------------------------------------
using FluentValidation.TestHelper;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Validators;

namespace SiesaAgents.UnitTests.Application.Clientes;

public class CreateClienteRequestValidatorBoundaryTests
{
    private readonly CreateClienteRequestValidator _validator = new();

    private static CreateClienteRequest ValidRequest(
        string? nombre = null,
        string? nit = null,
        string? telefono = null,
        string? ciudad = null) =>
        new(
            nombre ?? "Acme Corp",
            nit ?? "900123456-7",
            telefono ?? "+57 300 111 1111",
            ciudad ?? "Cali");

    // -------------------------------------------------------------------------
    // Upper boundary — exactly at max must PASS.
    // -------------------------------------------------------------------------

    [Fact]
    public void Validate_NombreExactlyAtMax_Passes()
    {
        var request = ValidRequest(nombre: new string('A', 200));
        var result = _validator.TestValidate(request);
        result.ShouldNotHaveValidationErrorFor(r => r.Nombre);
    }

    [Fact]
    public void Validate_NitExactlyAtMax_Passes()
    {
        var request = ValidRequest(nit: new string('A', 50));
        var result = _validator.TestValidate(request);
        result.ShouldNotHaveValidationErrorFor(r => r.Nit);
    }

    [Fact]
    public void Validate_TelefonoExactlyAtMax_Passes()
    {
        var request = ValidRequest(telefono: new string('A', 50));
        var result = _validator.TestValidate(request);
        result.ShouldNotHaveValidationErrorFor(r => r.Telefono);
    }

    [Fact]
    public void Validate_CiudadExactlyAtMax_Passes()
    {
        var request = ValidRequest(ciudad: new string('A', 100));
        var result = _validator.TestValidate(request);
        result.ShouldNotHaveValidationErrorFor(r => r.Ciudad);
    }

    // -------------------------------------------------------------------------
    // Just over the boundary — off-by-one guards.
    // -------------------------------------------------------------------------

    [Theory]
    [InlineData(201, "Nombre")]
    [InlineData(51, "Nit")]
    [InlineData(51, "Telefono")]
    [InlineData(101, "Ciudad")]
    public void Validate_ExactlyOneOverMax_Fails(int length, string field)
    {
        var big = new string('A', length);
        var request = field switch
        {
            "Nombre" => ValidRequest(nombre: big),
            "Nit" => ValidRequest(nit: big),
            "Telefono" => ValidRequest(telefono: big),
            "Ciudad" => ValidRequest(ciudad: big),
            _ => throw new ArgumentOutOfRangeException(nameof(field)),
        };

        var result = _validator.TestValidate(request);
        result.ShouldHaveValidationErrorFor(field);
    }

    // -------------------------------------------------------------------------
    // Multi-field failures must ALL be reported (no short-circuit).
    // -------------------------------------------------------------------------

    [Fact]
    public void Validate_EmptyNombre_AndMaxLengthNit_Reports_Both_Errors()
    {
        var request = new CreateClienteRequest(
            Nombre: string.Empty,
            Nit: new string('A', 51),
            Telefono: "+57 300",
            Ciudad: "Cali");

        var result = _validator.TestValidate(request);

        result.ShouldHaveValidationErrorFor(r => r.Nombre);
        result.ShouldHaveValidationErrorFor(r => r.Nit);
        result.ShouldNotHaveValidationErrorFor(r => r.Telefono);
        result.ShouldNotHaveValidationErrorFor(r => r.Ciudad);
    }

    [Fact]
    public void Validate_MaxLengthOnAllFields_ReportsFourMaxLengthErrors()
    {
        var request = new CreateClienteRequest(
            Nombre: new string('A', 201),
            Nit: new string('A', 51),
            Telefono: new string('A', 51),
            Ciudad: new string('A', 101));

        var result = _validator.TestValidate(request);

        result.ShouldHaveValidationErrorFor(r => r.Nombre)
            .WithErrorMessage("El nombre no puede exceder 200 caracteres.");
        result.ShouldHaveValidationErrorFor(r => r.Nit)
            .WithErrorMessage("El NIT/RUC no puede exceder 50 caracteres.");
        result.ShouldHaveValidationErrorFor(r => r.Telefono)
            .WithErrorMessage("El teléfono no puede exceder 50 caracteres.");
        result.ShouldHaveValidationErrorFor(r => r.Ciudad)
            .WithErrorMessage("La ciudad no puede exceder 100 caracteres.");
    }

    // -------------------------------------------------------------------------
    // Content-agnostic — special characters are the domain/renderer's concern.
    // -------------------------------------------------------------------------

    [Theory]
    [InlineData("<script>alert('xss')</script>")]
    [InlineData("' OR '1'='1")]
    [InlineData("Comercializadora Águilas Ñandú S.A.S.")]
    [InlineData("Empresa 🚀 Tech")]
    [InlineData("東京")]
    [InlineData("\"><img src=x onerror=alert(1)>")]
    public void Validate_SpecialCharactersInNombre_PassLengthValidation(string nombre)
    {
        var request = ValidRequest(nombre: nombre);
        var result = _validator.TestValidate(request);
        // The validator is deliberately content-agnostic — its job is length +
        // required. XSS escaping is the presenter's responsibility (React/DOM),
        // and injection is prevented by parameterised EF Core queries.
        result.ShouldNotHaveValidationErrorFor(r => r.Nombre);
    }

    // -------------------------------------------------------------------------
    // Additional whitespace flavors that must be treated as empty.
    // -------------------------------------------------------------------------

    [Theory]
    [InlineData("\r\n")]
    [InlineData("\t\t\t")]
    [InlineData(" \t \n ")]
    // Non-breaking space and tab-only combos still whitespace per char.IsWhiteSpace.
    [InlineData(" ")]
    [InlineData("   ")]
    public void Validate_ExoticWhitespaceValues_TreatedAsEmpty(string exotic)
    {
        var request = ValidRequest(nombre: exotic);
        var result = _validator.TestValidate(request);
        // FluentValidation .NotEmpty() delegates to string.IsNullOrWhiteSpace which
        // matches Unicode whitespace via char.IsWhiteSpace — non-breaking space
        // is included.
        result.ShouldHaveValidationErrorFor(r => r.Nombre);
    }
}
