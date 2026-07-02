// -----------------------------------------------------------------------------
//  Story 2.3 — Create Client
//  Unit tests for CreateClienteRequestValidator (AC #3, #7).
// -----------------------------------------------------------------------------
using FluentValidation.TestHelper;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Validators;

namespace SiesaAgents.UnitTests.Application.Clientes;

public class CreateClienteRequestValidatorTests
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

    [Fact]
    public void Validate_AllFieldsValid_Succeeds()
    {
        var result = _validator.TestValidate(ValidRequest());
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("Nombre")]
    [InlineData("Nit")]
    [InlineData("Telefono")]
    [InlineData("Ciudad")]
    public void Validate_EmptyField_FailsWithExpectedMessage(string field)
    {
        var request = field switch
        {
            "Nombre" => ValidRequest(nombre: string.Empty),
            "Nit" => ValidRequest(nit: string.Empty),
            "Telefono" => ValidRequest(telefono: string.Empty),
            "Ciudad" => ValidRequest(ciudad: string.Empty),
            _ => throw new ArgumentOutOfRangeException(nameof(field)),
        };

        var result = _validator.TestValidate(request);

        var expectedMessage = field switch
        {
            "Nombre" => "El nombre es requerido.",
            "Nit" => "El NIT/RUC es requerido.",
            "Telefono" => "El teléfono es requerido.",
            "Ciudad" => "La ciudad es requerida.",
            _ => throw new ArgumentOutOfRangeException(nameof(field)),
        };

        result.ShouldHaveValidationErrorFor(field).WithErrorMessage(expectedMessage);
    }

    [Theory]
    [InlineData("Nombre", "   ")]
    [InlineData("Nit", " \t ")]
    [InlineData("Telefono", "\n")]
    [InlineData("Ciudad", "     ")]
    public void Validate_WhitespaceOnlyField_Fails(string field, string whitespaceValue)
    {
        var request = field switch
        {
            "Nombre" => ValidRequest(nombre: whitespaceValue),
            "Nit" => ValidRequest(nit: whitespaceValue),
            "Telefono" => ValidRequest(telefono: whitespaceValue),
            "Ciudad" => ValidRequest(ciudad: whitespaceValue),
            _ => throw new ArgumentOutOfRangeException(nameof(field)),
        };

        var result = _validator.TestValidate(request);

        // .NotEmpty() rejects whitespace-only inputs (equivalent to IsNullOrWhiteSpace).
        result.ShouldHaveValidationErrorFor(field);
    }

    [Fact]
    public void Validate_NombreExceedsMaxLength_Fails()
    {
        var request = ValidRequest(nombre: new string('A', 201));
        var result = _validator.TestValidate(request);
        result.ShouldHaveValidationErrorFor(r => r.Nombre)
            .WithErrorMessage("El nombre no puede exceder 200 caracteres.");
    }

    [Fact]
    public void Validate_NitExceedsMaxLength_Fails()
    {
        var request = ValidRequest(nit: new string('A', 51));
        var result = _validator.TestValidate(request);
        result.ShouldHaveValidationErrorFor(r => r.Nit)
            .WithErrorMessage("El NIT/RUC no puede exceder 50 caracteres.");
    }

    [Fact]
    public void Validate_TelefonoExceedsMaxLength_Fails()
    {
        var request = ValidRequest(telefono: new string('A', 51));
        var result = _validator.TestValidate(request);
        result.ShouldHaveValidationErrorFor(r => r.Telefono)
            .WithErrorMessage("El teléfono no puede exceder 50 caracteres.");
    }

    [Fact]
    public void Validate_CiudadExceedsMaxLength_Fails()
    {
        var request = ValidRequest(ciudad: new string('A', 101));
        var result = _validator.TestValidate(request);
        result.ShouldHaveValidationErrorFor(r => r.Ciudad)
            .WithErrorMessage("La ciudad no puede exceder 100 caracteres.");
    }

    [Fact]
    public void Validate_AllFieldsEmpty_ReturnsFourErrors()
    {
        var request = new CreateClienteRequest(string.Empty, string.Empty, string.Empty, string.Empty);
        var result = _validator.TestValidate(request);

        result.ShouldHaveValidationErrorFor(r => r.Nombre);
        result.ShouldHaveValidationErrorFor(r => r.Nit);
        result.ShouldHaveValidationErrorFor(r => r.Telefono);
        result.ShouldHaveValidationErrorFor(r => r.Ciudad);
    }
}
