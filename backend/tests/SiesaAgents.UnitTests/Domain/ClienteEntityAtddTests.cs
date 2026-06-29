using FluentAssertions;
using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.UnitTests.Domain;

/// <summary>
/// Story 2.1 — Client List & Search — Domain ATDD (RED phase).
///
/// Acceptance criteria covered:
///   AC #1 — ClienteEntity must:
///     • be created via a static Create() factory (private constructor)
///     • enforce FR8 (required-field validation: nombre, nit, telefono, ciudad)
///     • enforce length caps: nombre ≤ 200, nit ≤ 50, telefono ≤ 50, ciudad ≤ 100
///     • set CreatedAt / UpdatedAt to DateTimeOffset.UtcNow on Create
///     • use DateTimeOffset (NEVER DateTime)
///
/// These tests MUST fail until ClienteEntity is implemented per the story.
/// </summary>
public class ClienteEntityAtddTests
{
    // ─── Create — happy path ──────────────────────────────────────────────
    [Fact]
    public void Create_WithValidFields_ReturnsEntityWithGeneratedIdAndTimestamps()
    {
        // GIVEN: valid input values
        var before = DateTimeOffset.UtcNow;

        // WHEN: Create is called
        var cliente = ClienteEntity.Create("ACME Solutions SAS", "900111222-3", "3001112233", "Bogotá");

        // THEN: the entity is built with a stable id and UTC timestamps
        var after = DateTimeOffset.UtcNow;
        cliente.Id.Should().NotBe(Guid.Empty);
        cliente.Nombre.Should().Be("ACME Solutions SAS");
        cliente.Nit.Should().Be("900111222-3");
        cliente.Telefono.Should().Be("3001112233");
        cliente.Ciudad.Should().Be("Bogotá");
        cliente.CreatedAt.Should().BeOnOrAfter(before).And.BeOnOrBefore(after);
        cliente.UpdatedAt.Should().Be(cliente.CreatedAt);
    }

    // ─── Create — null/empty/whitespace rejection (FR8) ──────────────────
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WithMissingNombre_ThrowsArgumentException(string? nombre)
    {
        // WHEN/THEN: nombre is required
        Action act = () => ClienteEntity.Create(nombre!, "900111222", "3001112233", "Bogotá");
        act.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WithMissingNit_ThrowsArgumentException(string? nit)
    {
        Action act = () => ClienteEntity.Create("ACME", nit!, "3001112233", "Bogotá");
        act.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WithMissingTelefono_ThrowsArgumentException(string? telefono)
    {
        Action act = () => ClienteEntity.Create("ACME", "900111222", telefono!, "Bogotá");
        act.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WithMissingCiudad_ThrowsArgumentException(string? ciudad)
    {
        Action act = () => ClienteEntity.Create("ACME", "900111222", "3001112233", ciudad!);
        act.Should().Throw<ArgumentException>();
    }

    // ─── Create — length caps ────────────────────────────────────────────
    [Fact]
    public void Create_WithNombreOver200Chars_ThrowsArgumentException()
    {
        var nombre = new string('a', 201);
        Action act = () => ClienteEntity.Create(nombre, "900111222", "3001112233", "Bogotá");
        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Create_WithNitOver50Chars_ThrowsArgumentException()
    {
        var nit = new string('1', 51);
        Action act = () => ClienteEntity.Create("ACME", nit, "3001112233", "Bogotá");
        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Create_WithTelefonoOver50Chars_ThrowsArgumentException()
    {
        var telefono = new string('1', 51);
        Action act = () => ClienteEntity.Create("ACME", "900111222", telefono, "Bogotá");
        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Create_WithCiudadOver100Chars_ThrowsArgumentException()
    {
        var ciudad = new string('a', 101);
        Action act = () => ClienteEntity.Create("ACME", "900111222", "3001112233", ciudad);
        act.Should().Throw<ArgumentException>();
    }

    // ─── Type contract — DateTimeOffset, NEVER DateTime ──────────────────
    [Fact]
    public void Entity_CreatedAt_IsDateTimeOffset_NotDateTime()
    {
        // GIVEN: a created entity
        var cliente = ClienteEntity.Create("ACME", "900111222", "3001112233", "Bogotá");

        // THEN: the property type is DateTimeOffset (company contract)
        cliente.CreatedAt.GetType().Should().Be(typeof(DateTimeOffset));
        cliente.UpdatedAt.GetType().Should().Be(typeof(DateTimeOffset));
    }
}
