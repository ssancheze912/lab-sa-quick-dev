using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.UnitTests.Domain.Clientes;

/// <summary>
/// Story 2.1 — Automate (Edge Cases).
///
/// Expands ATDD coverage of the <see cref="ClienteEntity"/> factory with
/// boundary conditions and negative paths not exercised by the RED-phase
/// tests:
///   * Guard-clause behaviour for null / whitespace inputs (AC #9, DDD).
///   * Post-conditions on <see cref="ClienteEntity.Id"/> (non-empty Guid),
///     <see cref="ClienteEntity.CreatedAt"/> == <see cref="ClienteEntity.UpdatedAt"/>
///     at creation time.
///   * Field-value preservation (no accidental trim, no mutation).
///
/// [P0] tag → domain-layer invariants MUST hold on every commit.
/// </summary>
public sealed class ClienteEntityTests
{
    // [P0] GIVEN a null nombre, WHEN Create is called, THEN it throws ArgumentException.
    [Fact]
    public void Create_Throws_WhenNombreIsNull()
    {
        Assert.Throws<ArgumentNullException>(() =>
            ClienteEntity.Create(null!, "900123456", "3001234567", "Bogotá"));
    }

    // [P0] GIVEN an empty or whitespace nombre, WHEN Create is called, THEN it throws.
    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData("   ")]
    [InlineData("\t")]
    [InlineData("\n")]
    public void Create_Throws_WhenNombreIsWhitespace(string nombre)
    {
        Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create(nombre, "900123456", "3001234567", "Bogotá"));
    }

    // [P0] GIVEN a null / whitespace nit, WHEN Create is called, THEN it throws.
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData(" ")]
    public void Create_Throws_WhenNitIsMissing(string? nit)
    {
        Assert.ThrowsAny<ArgumentException>(() =>
            ClienteEntity.Create("Empresa X", nit!, "3001234567", "Bogotá"));
    }

    // [P0] GIVEN a null / whitespace telefono, WHEN Create is called, THEN it throws.
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData(" ")]
    public void Create_Throws_WhenTelefonoIsMissing(string? telefono)
    {
        Assert.ThrowsAny<ArgumentException>(() =>
            ClienteEntity.Create("Empresa X", "900123456", telefono!, "Bogotá"));
    }

    // [P0] GIVEN a null / whitespace ciudad, WHEN Create is called, THEN it throws.
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData(" ")]
    public void Create_Throws_WhenCiudadIsMissing(string? ciudad)
    {
        Assert.ThrowsAny<ArgumentException>(() =>
            ClienteEntity.Create("Empresa X", "900123456", "3001234567", ciudad!));
    }

    // [P1] GIVEN valid inputs, WHEN Create is called, THEN Id is a non-empty Guid.
    [Fact]
    public void Create_AssignsNonEmpty_Id()
    {
        var entity = ClienteEntity.Create("Empresa Uno", "900123456", "3001234567", "Bogotá");
        Assert.NotEqual(Guid.Empty, entity.Id);
    }

    // [P1] GIVEN two consecutive Create calls, WHEN comparing Ids, THEN they are distinct.
    [Fact]
    public void Create_GeneratesUnique_Ids()
    {
        var e1 = ClienteEntity.Create("A", "1", "1", "X");
        var e2 = ClienteEntity.Create("B", "2", "2", "Y");
        Assert.NotEqual(e1.Id, e2.Id);
    }

    // [P1] GIVEN valid inputs, WHEN Create is called, THEN CreatedAt equals UpdatedAt.
    [Fact]
    public void Create_SetsCreatedAt_EqualToUpdatedAt()
    {
        var entity = ClienteEntity.Create("Empresa Uno", "900123456", "3001234567", "Bogotá");
        Assert.Equal(entity.CreatedAt, entity.UpdatedAt);
    }

    // [P1] GIVEN valid inputs, WHEN Create is called, THEN timestamps use UTC (Offset == Zero).
    [Fact]
    public void Create_UsesUtcTimestamps()
    {
        var entity = ClienteEntity.Create("Empresa Uno", "900123456", "3001234567", "Bogotá");
        Assert.Equal(TimeSpan.Zero, entity.CreatedAt.Offset);
        Assert.Equal(TimeSpan.Zero, entity.UpdatedAt.Offset);
    }

    // [P1] GIVEN specific field values, WHEN Create is called, THEN the entity preserves them verbatim.
    [Fact]
    public void Create_PreservesFieldValues_Verbatim()
    {
        var entity = ClienteEntity.Create("  Empresa Con Espacios  ", "900-123-456", "300 123 4567", "Bogotá D.C.");

        // The domain layer does NOT trim — deep validation is Story 2.3+ (FluentValidation).
        Assert.Equal("  Empresa Con Espacios  ", entity.Nombre);
        Assert.Equal("900-123-456", entity.Nit);
        Assert.Equal("300 123 4567", entity.Telefono);
        Assert.Equal("Bogotá D.C.", entity.Ciudad);
    }

    // [P2] GIVEN Unicode strings (accents, emoji), WHEN Create is called, THEN they round-trip intact.
    [Fact]
    public void Create_SupportsUnicodeCharacters()
    {
        var entity = ClienteEntity.Create("Ñoño & Peña S.A.", "900123456", "3001234567", "Cañón, Antioquia");
        Assert.Equal("Ñoño & Peña S.A.", entity.Nombre);
        Assert.Equal("Cañón, Antioquia", entity.Ciudad);
    }

    // [P2] GIVEN CreatedAt < UtcNow shortly before invocation, WHEN Create is called, THEN CreatedAt is within 5s.
    [Fact]
    public void Create_SetsCreatedAt_ToCurrentUtcTime()
    {
        var before = DateTimeOffset.UtcNow;
        var entity = ClienteEntity.Create("Empresa Uno", "900123456", "3001234567", "Bogotá");
        var after = DateTimeOffset.UtcNow;

        Assert.InRange(entity.CreatedAt, before.AddSeconds(-1), after.AddSeconds(1));
    }
}
