using SiesaAgents.Application.Contactos.DTOs;
using SiesaAgents.Application.Contactos.Validators;
using Xunit;

namespace SiesaAgents.UnitTests.Contactos;

/// <summary>
/// Unit tests — Story 3.3: CreateContactoRequestValidator
///
/// Test IDs covered:
///   TC-E3-3-3-UNIT-1 (P2) — Validator rejects null Nombre
///   TC-E3-3-3-UNIT-2 (P2) — Validator rejects null Cargo
///   TC-E3-3-3-UNIT-3 (P2) — Validator rejects null Telefono
///   TC-E3-3-3-UNIT-4 (P2) — Validator rejects null Email
/// </summary>
public class CreateContactoValidatorTests
{
    private readonly CreateContactoRequestValidator _validator;

    public CreateContactoValidatorTests()
    {
        _validator = new CreateContactoRequestValidator();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-3-UNIT-1 (P2) — Validator rejects null Nombre
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-3-UNIT-1 (P2)
    /// GIVEN a CreateContactoRequest with null Nombre
    /// WHEN the validator runs
    /// THEN it reports a validation error on the Nombre property
    /// </summary>
    [Fact]
    public void Validator_WhenNombreIsNull_HasValidationError()
    {
        // ARRANGE
        var request = new CreateContactoRequest(
            Nombre: null!,
            Cargo: "Gerente",
            Telefono: "3001234567",
            Email: "test@empresa.co"
        );

        // ACT
        var result = _validator.Validate(request);

        // ASSERT
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContactoRequest.Nombre));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-3-UNIT-2 (P2) — Validator rejects null Cargo
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-3-UNIT-2 (P2)
    /// GIVEN a CreateContactoRequest with null Cargo
    /// WHEN the validator runs
    /// THEN it reports a validation error on the Cargo property
    /// </summary>
    [Fact]
    public void Validator_WhenCargoIsNull_HasValidationError()
    {
        // ARRANGE
        var request = new CreateContactoRequest(
            Nombre: "Juan Pérez",
            Cargo: null!,
            Telefono: "3001234567",
            Email: "test@empresa.co"
        );

        // ACT
        var result = _validator.Validate(request);

        // ASSERT
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContactoRequest.Cargo));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-3-UNIT-3 (P2) — Validator rejects null Telefono
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-3-UNIT-3 (P2)
    /// GIVEN a CreateContactoRequest with null Telefono
    /// WHEN the validator runs
    /// THEN it reports a validation error on the Telefono property
    /// </summary>
    [Fact]
    public void Validator_WhenTelefonoIsNull_HasValidationError()
    {
        // ARRANGE
        var request = new CreateContactoRequest(
            Nombre: "Juan Pérez",
            Cargo: "Gerente",
            Telefono: null!,
            Email: "test@empresa.co"
        );

        // ACT
        var result = _validator.Validate(request);

        // ASSERT
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContactoRequest.Telefono));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-3-UNIT-4 (P2) — Validator rejects null Email
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-3-UNIT-4 (P2)
    /// GIVEN a CreateContactoRequest with null Email
    /// WHEN the validator runs
    /// THEN it reports a validation error on the Email property
    /// </summary>
    [Fact]
    public void Validator_WhenEmailIsNull_HasValidationError()
    {
        // ARRANGE
        var request = new CreateContactoRequest(
            Nombre: "Juan Pérez",
            Cargo: "Gerente",
            Telefono: "3001234567",
            Email: null!
        );

        // ACT
        var result = _validator.Validate(request);

        // ASSERT
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContactoRequest.Email));
    }
}
