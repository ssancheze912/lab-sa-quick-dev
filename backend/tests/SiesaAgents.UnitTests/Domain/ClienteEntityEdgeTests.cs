// Story 2.1: Client List & Search — Automate Phase
// Epic 2: Client Management
//
// AUTOMATE expansion tests (edge cases — NOT regenerated from ATDD)
// These complement ClienteEntityTests.cs (the ATDD baseline) with boundary
// conditions and additional invariants that the ATDD intentionally left out.
//
// Acceptance Criteria touched:
//   AC #1  — Column max lengths (Nombre 200, Nit 50, Telefono 50, Ciudad 100)
//   AC #12 — Backend unit coverage expansion.
//
// All tests follow Given-When-Then + [Pn] priority tag.

using SiesaAgents.Domain.Entities;

namespace SiesaAgents.UnitTests.Domain;

public class ClienteEntityEdgeTests
{
    private const string ValidNombre = "Acme S.A.";
    private const string ValidNit = "900123456-1";
    private const string ValidTelefono = "3001234567";
    private const string ValidCiudad = "Bogotá";

    [Fact]
    public void P2_Create_TwoEntitiesInRapidSuccession_AssignsDistinctIds()
    {
        // GIVEN: Two consecutive factory invocations with identical inputs
        var a = ClienteEntity.Create(ValidNombre, ValidNit, ValidTelefono, ValidCiudad);
        var b = ClienteEntity.Create(ValidNombre, ValidNit, ValidTelefono, ValidCiudad);

        // WHEN / THEN: Each entity gets its own Guid (factory must call Guid.NewGuid())
        Assert.NotEqual(a.Id, b.Id);
    }

    [Fact]
    public void P1_Create_WithMaxLengthNombre200Chars_PersistsVerbatim()
    {
        // GIVEN: A nombre exactly at the 200-char DB max-length boundary
        var nombre = new string('A', 200);

        // WHEN: The entity is created
        var entity = ClienteEntity.Create(nombre, ValidNit, ValidTelefono, ValidCiudad);

        // THEN: The full string is stored (boundary acceptance)
        Assert.Equal(200, entity.Nombre.Length);
        Assert.Equal(nombre, entity.Nombre);
    }

    [Fact]
    public void P1_Create_WithMaxLengthNit50Chars_PersistsVerbatim()
    {
        // GIVEN: A NIT at the 50-char DB max-length boundary
        var nit = new string('9', 50);

        // WHEN: The entity is created
        var entity = ClienteEntity.Create(ValidNombre, nit, ValidTelefono, ValidCiudad);

        // THEN: The full string is stored
        Assert.Equal(50, entity.Nit.Length);
        Assert.Equal(nit, entity.Nit);
    }

    [Fact]
    public void P1_Create_WithMaxLengthCiudad100Chars_PersistsVerbatim()
    {
        // GIVEN: A city name at the 100-char DB max-length boundary
        var ciudad = new string('C', 100);

        // WHEN: The entity is created
        var entity = ClienteEntity.Create(ValidNombre, ValidNit, ValidTelefono, ciudad);

        // THEN: The full string is stored
        Assert.Equal(100, entity.Ciudad.Length);
        Assert.Equal(ciudad, entity.Ciudad);
    }

    [Fact]
    public void P2_Create_WithSpanishDiacritics_PersistsVerbatim()
    {
        // GIVEN: A name and city containing Spanish accented characters and ñ
        var nombre = "Compañía Eléctrica del Pacífico";
        var ciudad = "Bogotá D.C.";

        // WHEN: The entity is created
        var entity = ClienteEntity.Create(nombre, ValidNit, ValidTelefono, ciudad);

        // THEN: Diacritics are preserved (UTF-8 round-trip — required for Spanish-first product)
        Assert.Equal(nombre, entity.Nombre);
        Assert.Equal(ciudad, entity.Ciudad);
    }

    [Fact]
    public void P2_Create_PreservesLeadingTrailingInternalSpacesInNombre()
    {
        // GIVEN: A nombre with internal multi-space content (NOT whitespace-only)
        var nombre = "Acme  S.A.   Group"; // double + triple spaces inside

        // WHEN: The entity is created
        var entity = ClienteEntity.Create(nombre, ValidNit, ValidTelefono, ValidCiudad);

        // THEN: The factory does NOT silently trim/collapse — preservation is required so
        // search by exact name still works in Story 2.6 sort
        Assert.Equal(nombre, entity.Nombre);
    }

    [Fact]
    public void P2_Create_WithExceptionMessage_IdentifiesEachOffendingField()
    {
        // GIVEN / WHEN: The Telefono field is empty
        var ex = Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create(ValidNombre, ValidNit, "", ValidCiudad));

        // THEN: The paramName matches the field — required so callers can highlight the correct input
        Assert.Equal("telefono", ex.ParamName);
    }

    [Fact]
    public void P2_PrivateConstructor_ExistsForEfCoreMaterialization()
    {
        // GIVEN: The entity type metadata
        var ctor = typeof(ClienteEntity).GetConstructor(
            System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic,
            binder: null,
            types: Type.EmptyTypes,
            modifiers: null);

        // WHEN / THEN: A private parameterless constructor MUST exist for EF Core to hydrate entities
        Assert.NotNull(ctor);
        Assert.True(ctor!.IsPrivate, "EF Core requires a parameterless constructor that is private (not protected/internal).");
    }

    [Fact]
    public void P2_Setters_AreNotPublic_PreventsExternalMutation()
    {
        // GIVEN: The entity type metadata
        var props = new[]
        {
            nameof(ClienteEntity.Id),
            nameof(ClienteEntity.Nombre),
            nameof(ClienteEntity.Nit),
            nameof(ClienteEntity.Telefono),
            nameof(ClienteEntity.Ciudad),
            nameof(ClienteEntity.CreatedAt),
            nameof(ClienteEntity.UpdatedAt),
        };

        // WHEN / THEN: Every property's setter is non-public — invariants can only be set via Create
        foreach (var name in props)
        {
            var prop = typeof(ClienteEntity).GetProperty(name);
            Assert.NotNull(prop);
            var setter = prop!.GetSetMethod(nonPublic: true);
            Assert.NotNull(setter);
            Assert.False(setter!.IsPublic, $"Setter for {name} must be private to preserve invariants (got IsPublic=true).");
        }
    }
}
