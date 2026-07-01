using SiesaAgents.Application.Commands.Clientes;
using SiesaAgents.Application.Validators;

namespace SiesaAgents.UnitTests.Validators;

/// <summary>
/// Story 2.4 (AC #3, TC-E2-P1-10 backend leg): pure FluentValidation unit tests
/// for `UpdateClienteRequestValidator`, independent of HTTP/`WebApplicationFactory`.
/// Mirrors `CreateClienteRequestValidatorTests` exactly — `Id` is NOT validated
/// here (it comes from the route, not the body).
///
/// RED PHASE: `UpdateClienteCommand` and `UpdateClienteRequestValidator` do not
/// exist yet (Story 2.4, Task 2).
/// </summary>
public class UpdateClienteRequestValidatorTests
{
    private static UpdateClienteCommand ValidCommand() =>
        new(Guid.NewGuid(), "Cliente Válido SAS", "900123456-1", "3001234567", "Bogotá");

    [Fact]
    public void Validate_WithAllFieldsPopulated_IsValid()
    {
        // GIVEN a command with all required fields populated
        var validator = new UpdateClienteRequestValidator();
        var command = ValidCommand();

        // WHEN validating it
        var result = validator.Validate(command);

        // THEN validation succeeds
        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Validate_WithEmptyOrWhitespaceNombre_IsInvalid(string? nombre)
    {
        // GIVEN a command whose Nombre is empty/whitespace/null
        var validator = new UpdateClienteRequestValidator();
        var command = ValidCommand() with { Nombre = nombre! };

        // WHEN validating it
        var result = validator.Validate(command);

        // THEN validation fails with an error on Nombre
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateClienteCommand.Nombre));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Validate_WithEmptyOrWhitespaceNit_IsInvalid(string? nit)
    {
        // GIVEN a command whose Nit is empty/whitespace/null
        var validator = new UpdateClienteRequestValidator();
        var command = ValidCommand() with { Nit = nit! };

        // WHEN validating it
        var result = validator.Validate(command);

        // THEN validation fails with an error on Nit
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateClienteCommand.Nit));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Validate_WithEmptyOrWhitespaceTelefono_IsInvalid(string? telefono)
    {
        // GIVEN a command whose Telefono is empty/whitespace/null
        var validator = new UpdateClienteRequestValidator();
        var command = ValidCommand() with { Telefono = telefono! };

        // WHEN validating it
        var result = validator.Validate(command);

        // THEN validation fails with an error on Telefono
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateClienteCommand.Telefono));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Validate_WithEmptyOrWhitespaceCiudad_IsInvalid(string? ciudad)
    {
        // GIVEN a command whose Ciudad is empty/whitespace/null
        var validator = new UpdateClienteRequestValidator();
        var command = ValidCommand() with { Ciudad = ciudad! };

        // WHEN validating it
        var result = validator.Validate(command);

        // THEN validation fails with an error on Ciudad
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateClienteCommand.Ciudad));
    }

    [Fact]
    public void Validate_WithAllFieldsWhitespaceOnly_ReturnsAnErrorForEachField()
    {
        // GIVEN a command where every required field is whitespace-only
        var validator = new UpdateClienteRequestValidator();
        var command = new UpdateClienteCommand(Guid.NewGuid(), "   ", "   ", "   ", "   ");

        // WHEN validating it
        var result = validator.Validate(command);

        // THEN all four fields report a validation error
        Assert.False(result.IsValid);
        var invalidProperties = result.Errors.Select(e => e.PropertyName).Distinct().ToList();
        Assert.Contains(nameof(UpdateClienteCommand.Nombre), invalidProperties);
        Assert.Contains(nameof(UpdateClienteCommand.Nit), invalidProperties);
        Assert.Contains(nameof(UpdateClienteCommand.Telefono), invalidProperties);
        Assert.Contains(nameof(UpdateClienteCommand.Ciudad), invalidProperties);
    }

    [Fact]
    public void Validate_DoesNotValidateIdField()
    {
        // GIVEN a command with the default (empty) Guid for Id — Id comes from
        // the route, not the body, so it must never be a validation target
        var validator = new UpdateClienteRequestValidator();
        var command = ValidCommand() with { Id = Guid.Empty };

        // WHEN validating it
        var result = validator.Validate(command);

        // THEN validation succeeds — Id is not part of this validator's rules
        Assert.True(result.IsValid);
    }
}
