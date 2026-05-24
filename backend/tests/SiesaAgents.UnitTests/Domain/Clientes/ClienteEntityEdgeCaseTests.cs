/**
 * Story 2.1: Client List & Search
 * Unit Tests — ClienteEntity Edge Cases (Automate — EXPAND)
 *
 * Covers boundary conditions and error paths NOT in ATDD tests:
 *   - Whitespace / empty string inputs
 *   - Maximum length boundary strings
 *   - Special characters in Nombre / NIT
 *   - Rapid successive Create() calls uniqueness at scale
 */

using SiesaAgents.Domain.Clientes.Entities;
using Xunit;

namespace SiesaAgents.UnitTests.Domain.Clientes;

public class ClienteEntityEdgeCaseTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: whitespace-only values
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Create_WithWhitespaceNombre_ShouldStoreWhitespaceAsProvided()
    {
        // GIVEN: Nombre is whitespace only (validation is enforced at API/Application layer, not domain)
        var cliente = ClienteEntity.Create("   ", "900000001-1", "3001111111", "Bogotá");

        // THEN: entity stores value as-is (domain layer is permissive)
        Assert.Equal("   ", cliente.Nombre);
    }

    [Fact]
    public void Create_WithWhitespaceNit_ShouldStoreWhitespaceAsProvided()
    {
        // GIVEN: Nit is whitespace only
        var cliente = ClienteEntity.Create("Empresa X", "   ", "3001111111", "Bogotá");

        // THEN: entity stores value as-is
        Assert.Equal("   ", cliente.Nit);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: maximum length strings (matches EF Core config: Nombre=200, Nit=50)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Create_WithMaxLengthNombre_ShouldStoreCorrectly()
    {
        // GIVEN: Nombre at exact max length of 200 chars
        var maxNombre = new string('A', 200);

        // WHEN: entity is created
        var cliente = ClienteEntity.Create(maxNombre, "900000099-9", "3001111111", "Bogotá");

        // THEN: Nombre is stored without truncation
        Assert.Equal(200, cliente.Nombre.Length);
        Assert.Equal(maxNombre, cliente.Nombre);
    }

    [Fact]
    public void Create_WithMaxLengthNit_ShouldStoreCorrectly()
    {
        // GIVEN: Nit at exact max length of 50 chars
        var maxNit = new string('9', 50);

        // WHEN: entity is created
        var cliente = ClienteEntity.Create("Empresa Max Nit", maxNit, "3001111111", "Bogotá");

        // THEN: Nit is stored without truncation
        Assert.Equal(50, cliente.Nit.Length);
        Assert.Equal(maxNit, cliente.Nit);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: special characters (accented, symbols)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Create_WithAccentedCharactersInNombre_ShouldStoreCorrectly()
    {
        // GIVEN: Nombre with accented Spanish characters (common in Colombian company names)
        const string nombre = "Compañía Ñoño Ltda. & Asociados Ñ";

        // WHEN: entity is created
        var cliente = ClienteEntity.Create(nombre, "900000010-0", "3001111111", "Bogotá");

        // THEN: special chars are preserved
        Assert.Equal(nombre, cliente.Nombre);
    }

    [Fact]
    public void Create_WithHyphenInNit_ShouldStoreCorrectly()
    {
        // GIVEN: NIT with standard Colombian format "XXXXXXXXX-D" (hyphen + digit)
        const string nit = "900123456-1";

        // WHEN: entity is created
        var cliente = ClienteEntity.Create("Empresa Nit Hyphen", nit, "3001111111", "Cali");

        // THEN: hyphen is preserved in Nit
        Assert.Equal("900123456-1", cliente.Nit);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: Ciudad and Telefono edge values
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Create_WithMaxLengthCiudad_ShouldStoreCorrectly()
    {
        // GIVEN: Ciudad at exact max length of 100 chars
        var maxCiudad = new string('B', 100);

        // WHEN: entity is created
        var cliente = ClienteEntity.Create("Empresa Ciudad Max", "900000011-1", "3001111111", maxCiudad);

        // THEN: Ciudad is stored without truncation
        Assert.Equal(100, cliente.Ciudad.Length);
    }

    [Fact]
    public void Create_WithMaxLengthTelefono_ShouldStoreCorrectly()
    {
        // GIVEN: Telefono at exact max length of 50 chars
        var maxTelefono = new string('3', 50);

        // WHEN: entity is created
        var cliente = ClienteEntity.Create("Empresa Tel Max", "900000012-2", maxTelefono, "Medellín");

        // THEN: Telefono is stored without truncation
        Assert.Equal(50, cliente.Telefono.Length);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: uniqueness at scale — 100 rapid Create() calls
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Create_Called100Times_ShouldGenerateAllUniqueIds()
    {
        // GIVEN / WHEN: 100 entities created in a tight loop
        var ids = Enumerable.Range(0, 100)
            .Select(i => ClienteEntity.Create($"Empresa {i}", $"9000{i:D6}-{i % 10}", "3001111111", "Bogotá").Id)
            .ToList();

        // THEN: all IDs are distinct
        Assert.Equal(100, ids.Distinct().Count());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Immutability: private setters mean properties cannot be changed after creation
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Create_PropertiesAreReadOnly_NombreCannotBeChangedExternally()
    {
        // GIVEN: entity created
        var cliente = ClienteEntity.Create("Empresa Original", "900000020-0", "3001111111", "Bogotá");

        // THEN: Nombre property has no public setter (this is a compile-time guarantee
        //       but we verify the value hasn't changed after creation)
        var property = typeof(ClienteEntity).GetProperty("Nombre");
        Assert.NotNull(property);
        Assert.Null(property!.SetMethod?.IsPublic == true ? property.SetMethod : null);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Timestamp: UtcNow timezone offset is zero (UTC)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Create_CreatedAtShouldBeUtc()
    {
        // GIVEN / WHEN: entity is created
        var cliente = ClienteEntity.Create("Empresa UTC", "900000030-0", "3001111111", "Bogotá");

        // THEN: CreatedAt offset is UTC (zero offset)
        Assert.Equal(TimeSpan.Zero, cliente.CreatedAt.Offset);
    }

    [Fact]
    public void Create_UpdatedAtShouldBeUtc()
    {
        // GIVEN / WHEN: entity is created
        var cliente = ClienteEntity.Create("Empresa UTC2", "900000031-1", "3001111111", "Bogotá");

        // THEN: UpdatedAt offset is UTC (zero offset)
        Assert.Equal(TimeSpan.Zero, cliente.UpdatedAt.Offset);
    }
}
