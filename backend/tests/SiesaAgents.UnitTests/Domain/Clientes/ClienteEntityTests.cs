using System;
using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.UnitTests.Domain.Clientes;

/// <summary>
/// Story 2.1 (Epic 2: Client Management), AC #1 — ATDD Acceptance Tests, RED phase.
///
/// RED phase: fails to compile today with CS0234 ("the type or namespace name
/// 'Clientes' does not exist in the namespace 'SiesaAgents.Domain'") because
/// <c>SiesaAgents.Domain.Clientes.Entities.ClienteEntity</c> does not exist yet
/// (Story 2.1 Task 1). Once created, these facts exercise the domain factory's
/// defense-in-depth validation described in the story (full FluentValidation/Zod
/// validation is explicitly out of scope — that belongs to Story 2.3).
/// </summary>
public class ClienteEntityTests
{
    private const string ValidNombre = "Acme Corp";
    private const string ValidNit = "900123456";
    private const string ValidTelefono = "3001234567";
    private const string ValidCiudad = "Bogotá";

    [Fact]
    public void Create_SetsNombreFromArgument()
    {
        // GIVEN a valid Nombre
        // WHEN ClienteEntity.Create is called
        var cliente = ClienteEntity.Create(ValidNombre, ValidNit, ValidTelefono, ValidCiudad);

        // THEN the entity's Nombre matches the argument
        Assert.Equal(ValidNombre, cliente.Nombre);
    }

    [Fact]
    public void Create_SetsNitFromArgument()
    {
        // GIVEN a valid Nit
        // WHEN ClienteEntity.Create is called
        var cliente = ClienteEntity.Create(ValidNombre, ValidNit, ValidTelefono, ValidCiudad);

        // THEN the entity's Nit matches the argument
        Assert.Equal(ValidNit, cliente.Nit);
    }

    [Fact]
    public void Create_SetsTelefonoFromArgument()
    {
        // GIVEN a valid Telefono
        // WHEN ClienteEntity.Create is called
        var cliente = ClienteEntity.Create(ValidNombre, ValidNit, ValidTelefono, ValidCiudad);

        // THEN the entity's Telefono matches the argument
        Assert.Equal(ValidTelefono, cliente.Telefono);
    }

    [Fact]
    public void Create_SetsCiudadFromArgument()
    {
        // GIVEN a valid Ciudad
        // WHEN ClienteEntity.Create is called
        var cliente = ClienteEntity.Create(ValidNombre, ValidNit, ValidTelefono, ValidCiudad);

        // THEN the entity's Ciudad matches the argument
        Assert.Equal(ValidCiudad, cliente.Ciudad);
    }

    [Fact]
    public void Create_GeneratesNonEmptyGuidId()
    {
        // GIVEN valid constructor arguments
        // WHEN ClienteEntity.Create is called
        var cliente = ClienteEntity.Create(ValidNombre, ValidNit, ValidTelefono, ValidCiudad);

        // THEN a non-empty Guid.NewGuid()-generated Id is assigned
        Assert.NotEqual(Guid.Empty, cliente.Id);
    }

    [Fact]
    public void Create_GeneratesUniqueIdPerCall()
    {
        // GIVEN two separate Create calls with identical field values
        var first = ClienteEntity.Create(ValidNombre, ValidNit, ValidTelefono, ValidCiudad);
        var second = ClienteEntity.Create(ValidNombre, "900999888", ValidTelefono, ValidCiudad);

        // WHEN their Ids are compared
        // THEN each call receives its own unique Id
        Assert.NotEqual(first.Id, second.Id);
    }

    [Fact]
    public void Create_SetsCreatedAtCloseToUtcNow()
    {
        // GIVEN the moment immediately before creation
        var before = DateTimeOffset.UtcNow;

        // WHEN ClienteEntity.Create is called
        var cliente = ClienteEntity.Create(ValidNombre, ValidNit, ValidTelefono, ValidCiudad);
        var after = DateTimeOffset.UtcNow;

        // THEN CreatedAt falls within the creation window (DateTimeOffset, never DateTime)
        Assert.InRange(cliente.CreatedAt, before.AddSeconds(-1), after.AddSeconds(1));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_ThrowsArgumentException_WhenNombreIsEmptyOrWhitespace(string invalidNombre)
    {
        // GIVEN an empty/whitespace Nombre with otherwise valid fields
        // WHEN ClienteEntity.Create is called
        // THEN it throws ArgumentException (defense-in-depth per Story 2.1 Task 1)
        Assert.Throws<ArgumentException>(
            () => ClienteEntity.Create(invalidNombre, ValidNit, ValidTelefono, ValidCiudad));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_ThrowsArgumentException_WhenNitIsEmptyOrWhitespace(string invalidNit)
    {
        // GIVEN an empty/whitespace Nit with otherwise valid fields
        // WHEN ClienteEntity.Create is called
        // THEN it throws ArgumentException
        Assert.Throws<ArgumentException>(
            () => ClienteEntity.Create(ValidNombre, invalidNit, ValidTelefono, ValidCiudad));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_ThrowsArgumentException_WhenTelefonoIsEmptyOrWhitespace(string invalidTelefono)
    {
        // GIVEN an empty/whitespace Telefono with otherwise valid fields
        // WHEN ClienteEntity.Create is called
        // THEN it throws ArgumentException
        Assert.Throws<ArgumentException>(
            () => ClienteEntity.Create(ValidNombre, ValidNit, invalidTelefono, ValidCiudad));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_ThrowsArgumentException_WhenCiudadIsEmptyOrWhitespace(string invalidCiudad)
    {
        // GIVEN an empty/whitespace Ciudad with otherwise valid fields
        // WHEN ClienteEntity.Create is called
        // THEN it throws ArgumentException
        Assert.Throws<ArgumentException>(
            () => ClienteEntity.Create(ValidNombre, ValidNit, ValidTelefono, invalidCiudad));
    }
}
