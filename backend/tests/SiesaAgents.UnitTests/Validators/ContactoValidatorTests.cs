using SiesaAgents.Application.Contactos.Commands;
using SiesaAgents.Application.Contactos.Validators;
using FluentValidation;

namespace SiesaAgents.UnitTests.Validators;

/// <summary>
/// Unit tests for CreateContactoCommandValidator.
///
/// Tests are in RED phase — CreateContactoCommandValidator does not exist yet.
/// Make these tests GREEN by implementing:
///   backend/src/SiesaAgents.Application/Contactos/Commands/CreateContactoCommand.cs
///   backend/src/SiesaAgents.Application/Contactos/Validators/CreateContactoCommandValidator.cs
///
/// Test IDs: UNIT-B-CT-01, UNIT-B-CT-02, UNIT-B-CT-03
/// </summary>
public class ContactoValidatorTests
{
    private readonly CreateContactoCommandValidator _validator = new();

    // ---------------------------------------------------------------------------
    // UNIT-B-CT-01 (P1 · AC3)
    // Given a CreateContactoCommand with an empty Nombre
    // When the validator runs
    // Then validation fails
    //   AND the error is on the Nombre property
    //   AND the error message is in Spanish (localized)
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validate_EmptyNombre_ReturnsInvalidResultWithLocalizedMessage()
    {
        // GIVEN — command with empty Nombre
        var command = new CreateContactoCommand(
            Nombre: string.Empty,
            Cargo: "Gerente Comercial",
            Telefono: "+57 1 234 5679",
            Email: "test@empresa.com"
        );

        // WHEN — validator runs
        var result = await _validator.ValidateAsync(command);

        // THEN — validation fails
        Assert.False(result.IsValid);

        // AND — error is on Nombre property
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContactoCommand.Nombre));

        // AND — error message is non-empty (Spanish localization: "El nombre es requerido")
        var nombreError = result.Errors.First(e => e.PropertyName == nameof(CreateContactoCommand.Nombre));
        Assert.False(string.IsNullOrWhiteSpace(nombreError.ErrorMessage));
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-CT-02 (P1 · AC3)
    // Given a CreateContactoCommand with an empty Email
    // When the validator runs
    // Then validation fails
    //   AND the error is on the Email property
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validate_EmptyEmail_ReturnsInvalidResult()
    {
        // GIVEN — command with empty Email
        var command = new CreateContactoCommand(
            Nombre: "María García",
            Cargo: "Gerente Comercial",
            Telefono: "+57 1 234 5679",
            Email: string.Empty
        );

        // WHEN — validator runs
        var result = await _validator.ValidateAsync(command);

        // THEN — validation fails
        Assert.False(result.IsValid);

        // AND — error is on Email property
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContactoCommand.Email));
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-CT-03 (P1 · AC2)
    // Given a CreateContactoCommand with valid Nombre, Cargo, Telefono, and Email
    // When the validator runs
    // Then validation passes with no errors
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validate_ValidPayload_ReturnsValidResult()
    {
        // GIVEN — command with all required fields valid
        var command = new CreateContactoCommand(
            Nombre: "María García",
            Cargo: "Gerente Comercial",
            Telefono: "+57 1 234 5679",
            Email: "m.garcia@empresa.com"
        );

        // WHEN — validator runs
        var result = await _validator.ValidateAsync(command);

        // THEN — validation passes
        Assert.True(result.IsValid);
        Assert.Empty(result.Errors);
    }

    // ---------------------------------------------------------------------------
    // Additional: Empty Cargo fails validation
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validate_EmptyCargo_ReturnsInvalidResult()
    {
        var command = new CreateContactoCommand(
            Nombre: "María García",
            Cargo: string.Empty,
            Telefono: "+57 1 234 5679",
            Email: "m.garcia@empresa.com"
        );

        var result = await _validator.ValidateAsync(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContactoCommand.Cargo));
    }

    // ---------------------------------------------------------------------------
    // Additional: Invalid email format fails validation
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validate_InvalidEmailFormat_ReturnsInvalidResult()
    {
        var command = new CreateContactoCommand(
            Nombre: "María García",
            Cargo: "Gerente Comercial",
            Telefono: "+57 1 234 5679",
            Email: "not-an-email"
        );

        var result = await _validator.ValidateAsync(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContactoCommand.Email));
    }

    // ---------------------------------------------------------------------------
    // Additional: All fields empty produces at least 4 separate errors
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validate_AllFieldsEmpty_ReturnsFourOrMoreErrors()
    {
        var command = new CreateContactoCommand(
            Nombre: string.Empty,
            Cargo: string.Empty,
            Telefono: string.Empty,
            Email: string.Empty
        );

        var result = await _validator.ValidateAsync(command);

        Assert.False(result.IsValid);
        Assert.True(result.Errors.Count >= 4,
            $"Expected at least 4 errors, got {result.Errors.Count}");
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContactoCommand.Nombre));
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContactoCommand.Cargo));
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContactoCommand.Telefono));
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContactoCommand.Email));
    }
}

/// <summary>
/// Unit tests for UpdateContactoCommandValidator.
///
/// Test IDs: UNIT-B-CT-08, UNIT-B-CT-09
/// </summary>
public class UpdateContactoValidatorTests
{
    private readonly UpdateContactoCommandValidator _validator = new();

    // ---------------------------------------------------------------------------
    // UNIT-B-CT-08 (P1 · AC3)
    // Given an UpdateContactoCommand with an empty Nombre
    // When the validator runs
    // Then validation fails
    //   AND the error is on the Nombre property
    //   AND the error message is in Spanish (localized)
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validate_EmptyNombre_ReturnsInvalidResultWithLocalizedMessage()
    {
        // GIVEN — command with empty Nombre
        var command = new UpdateContactoCommand(
            Id: Guid.NewGuid(),
            Nombre: string.Empty,
            Cargo: "Gerente Comercial",
            Telefono: "+57 1 234 5679",
            Email: "test@empresa.com"
        );

        // WHEN — validator runs
        var result = await _validator.ValidateAsync(command);

        // THEN — validation fails
        Assert.False(result.IsValid);

        // AND — error is on Nombre property
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateContactoCommand.Nombre));

        // AND — error message is in Spanish ("El nombre es requerido")
        var nombreError = result.Errors.First(e => e.PropertyName == nameof(UpdateContactoCommand.Nombre));
        Assert.False(string.IsNullOrWhiteSpace(nombreError.ErrorMessage));
        Assert.Equal("El nombre es requerido", nombreError.ErrorMessage);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-CT-09 (P1 · AC2)
    // Given an UpdateContactoCommand with all valid fields
    // When the validator runs
    // Then validation passes with no errors
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validate_ValidPayload_ReturnsValidResult()
    {
        // GIVEN — command with all required fields valid
        var command = new UpdateContactoCommand(
            Id: Guid.NewGuid(),
            Nombre: "María García",
            Cargo: "Gerente Comercial",
            Telefono: "+57 1 234 5679",
            Email: "m.garcia@empresa.com"
        );

        // WHEN — validator runs
        var result = await _validator.ValidateAsync(command);

        // THEN — validation passes
        Assert.True(result.IsValid);
        Assert.Empty(result.Errors);
    }
}
