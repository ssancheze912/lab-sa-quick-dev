using Xunit;
using SiesaAgents.Application.Clientes.Commands;

// STORY 2.4 — Edit Client
// Unit tests for UpdateClienteCommandValidator
//
// AC Coverage:
//   AC3 — Validator rejects empty required fields (Nombre, NitRuc, Telefono, Ciudad)
//
// Test IDs:
//   TC-E2-P3-04 (edit variant): UpdateClienteCommandValidator with Nombre = "" → fails on Nombre field

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Unit tests for UpdateClienteCommandValidator (Story 2.4).
/// Framework: xUnit + FluentValidation
/// </summary>
public class UpdateClienteCommandValidatorTests
{
    private readonly UpdateClienteCommandValidator _validator = new();

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-P3-04 (edit variant): Empty Nombre fails validation
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-P3-04:
    /// GIVEN: An UpdateClienteCommand with Nombre = ""
    /// WHEN:  Validator.ValidateAsync is called
    /// THEN:  Validation fails with an error on the Nombre field
    /// </summary>
    [Fact]
    public async Task GivenEmptyNombre_WhenValidate_ThenFailsOnNombreField()
    {
        // ARRANGE
        var command = new UpdateClienteCommand(
            Id: Guid.NewGuid(),
            Nombre: "",
            NitRuc: "900123456-1",
            Telefono: "3001234567",
            Ciudad: "Bogotá"
        );

        // ACT
        var result = await _validator.ValidateAsync(command);

        // ASSERT
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Nombre");
    }

    /// <summary>
    /// GIVEN: An UpdateClienteCommand with NitRuc = ""
    /// WHEN:  Validator.ValidateAsync is called
    /// THEN:  Validation fails with an error on the NitRuc field
    /// </summary>
    [Fact]
    public async Task GivenEmptyNitRuc_WhenValidate_ThenFailsOnNitRucField()
    {
        // ARRANGE
        var command = new UpdateClienteCommand(
            Id: Guid.NewGuid(),
            Nombre: "Empresa Test",
            NitRuc: "",
            Telefono: "3001234567",
            Ciudad: "Bogotá"
        );

        // ACT
        var result = await _validator.ValidateAsync(command);

        // ASSERT
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "NitRuc");
    }

    /// <summary>
    /// GIVEN: An UpdateClienteCommand with Telefono = ""
    /// WHEN:  Validator.ValidateAsync is called
    /// THEN:  Validation fails with an error on the Telefono field
    /// </summary>
    [Fact]
    public async Task GivenEmptyTelefono_WhenValidate_ThenFailsOnTelefonoField()
    {
        // ARRANGE
        var command = new UpdateClienteCommand(
            Id: Guid.NewGuid(),
            Nombre: "Empresa Test",
            NitRuc: "900123456-1",
            Telefono: "",
            Ciudad: "Bogotá"
        );

        // ACT
        var result = await _validator.ValidateAsync(command);

        // ASSERT
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Telefono");
    }

    /// <summary>
    /// GIVEN: An UpdateClienteCommand with Ciudad = ""
    /// WHEN:  Validator.ValidateAsync is called
    /// THEN:  Validation fails with an error on the Ciudad field
    /// </summary>
    [Fact]
    public async Task GivenEmptyCiudad_WhenValidate_ThenFailsOnCiudadField()
    {
        // ARRANGE
        var command = new UpdateClienteCommand(
            Id: Guid.NewGuid(),
            Nombre: "Empresa Test",
            NitRuc: "900123456-1",
            Telefono: "3001234567",
            Ciudad: ""
        );

        // ACT
        var result = await _validator.ValidateAsync(command);

        // ASSERT
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Ciudad");
    }

    /// <summary>
    /// GIVEN: A valid UpdateClienteCommand with all fields populated
    /// WHEN:  Validator.ValidateAsync is called
    /// THEN:  Validation passes
    /// </summary>
    [Fact]
    public async Task GivenAllFieldsPopulated_WhenValidate_ThenPasses()
    {
        // ARRANGE
        var command = new UpdateClienteCommand(
            Id: Guid.NewGuid(),
            Nombre: "Empresa Test S.A.S.",
            NitRuc: "900123456-1",
            Telefono: "3001234567",
            Ciudad: "Bogotá"
        );

        // ACT
        var result = await _validator.ValidateAsync(command);

        // ASSERT
        Assert.True(result.IsValid);
    }
}
