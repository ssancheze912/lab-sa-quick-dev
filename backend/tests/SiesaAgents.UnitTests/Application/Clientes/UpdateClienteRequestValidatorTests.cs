// -----------------------------------------------------------------------------
//  Story 2.4 — Edit Client
//  Unit tests for UpdateClienteRequestValidator (AC #3, #9).
//  Verifies: required-field messages + MaxLength boundary for the 4 mutable fields.
// -----------------------------------------------------------------------------
using FluentValidation.TestHelper;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Validators;

namespace SiesaAgents.UnitTests.Application.Clientes;

public class UpdateClienteRequestValidatorTests
{
    private readonly UpdateClienteRequestValidator _validator = new();

    [Fact]
    public void Validate_AllFieldsValid_Succeeds()
    {
        var request = new UpdateClienteRequest("Acme", "900-1", "+57 300", "Cali");

        var result = _validator.TestValidate(request);

        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("", "Nombre", "El nombre es requerido.")]
    [InlineData("", "Nit", "El NIT/RUC es requerido.")]
    [InlineData("", "Telefono", "El teléfono es requerido.")]
    [InlineData("", "Ciudad", "La ciudad es requerida.")]
    public void Validate_EmptyField_FailsWithExpectedMessage(string invalid, string field, string message)
    {
        var request = new UpdateClienteRequest(
            field == "Nombre" ? invalid : "Acme",
            field == "Nit" ? invalid : "900-1",
            field == "Telefono" ? invalid : "+57 300",
            field == "Ciudad" ? invalid : "Cali");

        var result = _validator.TestValidate(request);

        result.ShouldHaveValidationErrorFor(field).WithErrorMessage(message);
    }

    [Theory]
    [InlineData("Nombre")]
    [InlineData("Nit")]
    [InlineData("Telefono")]
    [InlineData("Ciudad")]
    public void Validate_WhitespaceOnlyField_Fails(string field)
    {
        var whitespace = "   ";
        var request = new UpdateClienteRequest(
            field == "Nombre" ? whitespace : "Acme",
            field == "Nit" ? whitespace : "900-1",
            field == "Telefono" ? whitespace : "+57 300",
            field == "Ciudad" ? whitespace : "Cali");

        var result = _validator.TestValidate(request);

        result.ShouldHaveValidationErrorFor(field);
    }

    [Theory]
    [InlineData("Nombre", 200)]
    [InlineData("Nit", 50)]
    [InlineData("Telefono", 50)]
    [InlineData("Ciudad", 100)]
    public void Validate_FieldExceedsMaxLength_Fails(string field, int max)
    {
        var overflow = new string('X', max + 1);
        var request = new UpdateClienteRequest(
            field == "Nombre" ? overflow : "Acme",
            field == "Nit" ? overflow : "900-1",
            field == "Telefono" ? overflow : "+57 300",
            field == "Ciudad" ? overflow : "Cali");

        var result = _validator.TestValidate(request);

        result.ShouldHaveValidationErrorFor(field);
    }
}
