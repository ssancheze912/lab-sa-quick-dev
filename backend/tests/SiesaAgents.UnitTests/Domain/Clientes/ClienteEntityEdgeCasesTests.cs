using System;
using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.UnitTests.Domain.Clientes;

/// <summary>
/// Story 2.1 (Epic 2: Client Management) — Automation Expansion (testarch-automate).
///
/// Edge cases NOT covered by the ATDD RED-phase suite (<see cref="ClienteEntityTests"/>):
/// null arguments (distinct code path from empty/whitespace, since <c>ArgumentException</c>
/// is thrown either way but null deserves its own explicit boundary test), the
/// <c>CreatedAt</c>/<c>UpdatedAt</c> parity invariant on creation, and acceptance of
/// legitimate non-ASCII input (accents/ñ), which must NOT be rejected by the
/// defense-in-depth validation.
/// </summary>
public class ClienteEntityEdgeCasesTests
{
    private const string ValidNombre = "Acme Corp";
    private const string ValidNit = "900123456";
    private const string ValidTelefono = "3001234567";
    private const string ValidCiudad = "Bogotá";

    [Fact]
    public void Create_ThrowsArgumentException_WhenNombreIsNull()
    {
        // GIVEN a null Nombre with otherwise valid fields
        // WHEN ClienteEntity.Create is called
        // THEN it throws ArgumentException (string.IsNullOrWhiteSpace(null) is true)
        Assert.Throws<ArgumentException>(
            () => ClienteEntity.Create(null!, ValidNit, ValidTelefono, ValidCiudad));
    }

    [Fact]
    public void Create_ThrowsArgumentException_WhenNitIsNull()
    {
        // GIVEN a null Nit with otherwise valid fields
        // WHEN ClienteEntity.Create is called
        // THEN it throws ArgumentException
        Assert.Throws<ArgumentException>(
            () => ClienteEntity.Create(ValidNombre, null!, ValidTelefono, ValidCiudad));
    }

    [Fact]
    public void Create_ThrowsArgumentException_WhenTelefonoIsNull()
    {
        // GIVEN a null Telefono with otherwise valid fields
        // WHEN ClienteEntity.Create is called
        // THEN it throws ArgumentException
        Assert.Throws<ArgumentException>(
            () => ClienteEntity.Create(ValidNombre, ValidNit, null!, ValidCiudad));
    }

    [Fact]
    public void Create_ThrowsArgumentException_WhenCiudadIsNull()
    {
        // GIVEN a null Ciudad with otherwise valid fields
        // WHEN ClienteEntity.Create is called
        // THEN it throws ArgumentException
        Assert.Throws<ArgumentException>(
            () => ClienteEntity.Create(ValidNombre, ValidNit, ValidTelefono, null!));
    }

    [Fact]
    public void Create_SetsUpdatedAtEqualToCreatedAt_OnInitialCreation()
    {
        // GIVEN valid constructor arguments
        // WHEN ClienteEntity.Create is called
        var cliente = ClienteEntity.Create(ValidNombre, ValidNit, ValidTelefono, ValidCiudad);

        // THEN CreatedAt and UpdatedAt are identical at creation time (no update has occurred yet)
        Assert.Equal(cliente.CreatedAt, cliente.UpdatedAt);
    }

    [Fact]
    public void Create_AllowsNombreWithAccentsAndNonAsciiCharacters()
    {
        // GIVEN a Nombre containing Spanish accents and ñ (legitimate business data, not
        // malformed input — defense-in-depth validation must not reject valid Unicode)
        const string nombreConAcentos = "Compañía Ñoño & Asociados S.A.S.";

        // WHEN ClienteEntity.Create is called
        var cliente = ClienteEntity.Create(nombreConAcentos, ValidNit, ValidTelefono, ValidCiudad);

        // THEN the Nombre is preserved exactly, with no exception thrown
        Assert.Equal(nombreConAcentos, cliente.Nombre);
    }

    [Fact]
    public void Create_ThrowsArgumentException_WhenNombreIsOnlyTabsAndNewlines()
    {
        // GIVEN a Nombre made only of non-space whitespace characters (tab, newline)
        const string onlyWhitespace = "\t\n\r";

        // WHEN ClienteEntity.Create is called
        // THEN it throws ArgumentException, same as plain spaces (string.IsNullOrWhiteSpace
        // treats all Unicode whitespace uniformly)
        Assert.Throws<ArgumentException>(
            () => ClienteEntity.Create(onlyWhitespace, ValidNit, ValidTelefono, ValidCiudad));
    }
}
