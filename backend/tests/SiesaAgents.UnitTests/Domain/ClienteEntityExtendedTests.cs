using FluentAssertions;
using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.UnitTests.Domain;

/// <summary>
/// Story 2.1 — Client List & Search — Domain edge-case automation expansion.
///
/// Complements <see cref="ClienteEntityAtddTests"/> with edge cases the ATDD layer
/// does not cover:
///   • [P2] ClienteEntity.Update() — the entity exposes Update() but no ATDD asserts it
///   • [P2] Boundary-length acceptance — exactly-at-cap inputs must succeed (off-by-one safety)
///   • [P2] Update() preserves Id and CreatedAt but advances UpdatedAt
///
/// References:
///   - test-levels-framework.md — Unit tests for pure logic edge cases
///   - test-priorities-matrix.md — P2 medium priority (boundaries / edge logic)
/// </summary>
public class ClienteEntityExtendedTests
{
    // ─── Update() — happy path ────────────────────────────────────────────
    [Fact]
    public void Update_WithValidFields_BumpsUpdatedAtButKeepsIdAndCreatedAt()
    {
        // GIVEN: an existing entity
        var cliente = ClienteEntity.Create("Original", "900111222", "3001112233", "Bogotá");
        var originalId = cliente.Id;
        var originalCreatedAt = cliente.CreatedAt;

        // Small spin so UpdatedAt moves forward measurably
        Thread.Sleep(15);

        // WHEN: Update runs with new field values
        cliente.Update("Updated Name", "800999888", "3009998888", "Medellín");

        // THEN: id + createdAt are preserved, fields are updated, UpdatedAt advances
        cliente.Id.Should().Be(originalId);
        cliente.CreatedAt.Should().Be(originalCreatedAt);
        cliente.Nombre.Should().Be("Updated Name");
        cliente.Nit.Should().Be("800999888");
        cliente.Telefono.Should().Be("3009998888");
        cliente.Ciudad.Should().Be("Medellín");
        cliente.UpdatedAt.Should().BeAfter(originalCreatedAt);
    }

    // ─── Update() — null/empty/whitespace rejection (FR8) ────────────────
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Update_WithMissingNombre_ThrowsArgumentException(string? nombre)
    {
        var cliente = ClienteEntity.Create("ACME", "900111222", "3001112233", "Bogotá");
        Action act = () => cliente.Update(nombre!, "900111222", "3001112233", "Bogotá");
        act.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Update_WithMissingNit_ThrowsArgumentException(string? nit)
    {
        var cliente = ClienteEntity.Create("ACME", "900111222", "3001112233", "Bogotá");
        Action act = () => cliente.Update("ACME", nit!, "3001112233", "Bogotá");
        act.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Update_WithMissingTelefono_ThrowsArgumentException(string? telefono)
    {
        var cliente = ClienteEntity.Create("ACME", "900111222", "3001112233", "Bogotá");
        Action act = () => cliente.Update("ACME", "900111222", telefono!, "Bogotá");
        act.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Update_WithMissingCiudad_ThrowsArgumentException(string? ciudad)
    {
        var cliente = ClienteEntity.Create("ACME", "900111222", "3001112233", "Bogotá");
        Action act = () => cliente.Update("ACME", "900111222", "3001112233", ciudad!);
        act.Should().Throw<ArgumentException>();
    }

    // ─── Update() — length caps reject over-cap input ─────────────────────
    [Fact]
    public void Update_WithNombreOver200Chars_ThrowsArgumentException()
    {
        var cliente = ClienteEntity.Create("ACME", "900111222", "3001112233", "Bogotá");
        Action act = () => cliente.Update(new string('a', 201), "900111222", "3001112233", "Bogotá");
        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Update_WithNitOver50Chars_ThrowsArgumentException()
    {
        var cliente = ClienteEntity.Create("ACME", "900111222", "3001112233", "Bogotá");
        Action act = () => cliente.Update("ACME", new string('1', 51), "3001112233", "Bogotá");
        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Update_WithCiudadOver100Chars_ThrowsArgumentException()
    {
        var cliente = ClienteEntity.Create("ACME", "900111222", "3001112233", "Bogotá");
        Action act = () => cliente.Update("ACME", "900111222", "3001112233", new string('c', 101));
        act.Should().Throw<ArgumentException>();
    }

    // ─── Boundary acceptance — values exactly at the cap must succeed ────
    [Fact]
    public void Create_WithNombreAtExactly200Chars_Succeeds()
    {
        var nombre = new string('a', 200);
        var cliente = ClienteEntity.Create(nombre, "900111222", "3001112233", "Bogotá");
        cliente.Nombre.Should().HaveLength(200).And.Be(nombre);
    }

    [Fact]
    public void Create_WithNitAtExactly50Chars_Succeeds()
    {
        var nit = new string('1', 50);
        var cliente = ClienteEntity.Create("ACME", nit, "3001112233", "Bogotá");
        cliente.Nit.Should().HaveLength(50).And.Be(nit);
    }

    [Fact]
    public void Create_WithTelefonoAtExactly50Chars_Succeeds()
    {
        var telefono = new string('1', 50);
        var cliente = ClienteEntity.Create("ACME", "900111222", telefono, "Bogotá");
        cliente.Telefono.Should().HaveLength(50).And.Be(telefono);
    }

    [Fact]
    public void Create_WithCiudadAtExactly100Chars_Succeeds()
    {
        var ciudad = new string('c', 100);
        var cliente = ClienteEntity.Create("ACME", "900111222", "3001112233", ciudad);
        cliente.Ciudad.Should().HaveLength(100).And.Be(ciudad);
    }

    // ─── Accents and unicode are preserved verbatim ───────────────────────
    [Fact]
    public void Create_WithAccentedAndUnicodeInputs_PreservesCharactersExactly()
    {
        // GIVEN: realistic Spanish input with accents + Ñ
        var nombre = "Distribuidora Año Niño S.A.S.";
        var ciudad = "Bogotá";

        // WHEN: Create runs
        var cliente = ClienteEntity.Create(nombre, "900111222", "3001112233", ciudad);

        // THEN: the characters are preserved byte-for-byte
        cliente.Nombre.Should().Be(nombre);
        cliente.Ciudad.Should().Be(ciudad);
    }

    // ─── Each call generates a fresh Guid (no shared state) ───────────────
    [Fact]
    public void Create_MultipleEntities_GenerateUniqueIds()
    {
        var a = ClienteEntity.Create("A", "900100100", "3001000000", "Bogotá");
        var b = ClienteEntity.Create("B", "900200200", "3002000000", "Medellín");
        a.Id.Should().NotBe(b.Id);
    }
}
