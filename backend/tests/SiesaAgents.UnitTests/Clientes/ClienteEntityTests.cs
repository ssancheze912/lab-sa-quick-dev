using SiesaAgents.Domain.Clientes.Entities;
using Xunit;

namespace SiesaAgents.UnitTests.Clientes;

/// <summary>
/// Unit tests — ClienteEntity domain model (edge cases and boundary conditions).
/// Expands ATDD coverage with Create() and Update() validation paths.
///
/// Test IDs:
///   TC-E2-2-1-UNIT-BE-1 (P1) — Create() throws on null Nombre
///   TC-E2-2-1-UNIT-BE-2 (P1) — Create() throws on whitespace-only Nombre
///   TC-E2-2-1-UNIT-BE-3 (P1) — Create() throws on null NIT
///   TC-E2-2-1-UNIT-BE-4 (P1) — Create() throws on whitespace-only NIT
///   TC-E2-2-1-UNIT-BE-5 (P1) — Create() throws on null Telefono
///   TC-E2-2-1-UNIT-BE-6 (P1) — Create() throws on null Ciudad
///   TC-E2-2-1-UNIT-BE-7 (P2) — Create() trims leading/trailing whitespace from all fields
///   TC-E2-2-1-UNIT-BE-8 (P2) — Create() sets DateTimeOffset (not DateTime) on CreatedAt
///   TC-E2-2-1-UNIT-BE-9 (P2) — Create() generates a non-empty Guid Id
///   TC-E2-2-1-UNIT-BE-10 (P2) — Update() overwrites all mutable fields and refreshes UpdatedAt
/// </summary>
public class ClienteEntityTests
{
    private const string ValidNombre = "Acme S.A.";
    private const string ValidNit = "900123456-1";
    private const string ValidTelefono = "3001234567";
    private const string ValidCiudad = "Bogotá";

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-1-UNIT-BE-1 (P1) — Create() throws on null Nombre
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-1-UNIT-BE-1 (P1)
    /// GIVEN a null value for Nombre
    /// WHEN ClienteEntity.Create() is called
    /// THEN ArgumentException is thrown
    /// </summary>
    [Fact]
    public void Create_WhenNombreIsNull_ThrowsArgumentException()
    {
        // GIVEN / WHEN / THEN
        Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create(null!, ValidNit, ValidTelefono, ValidCiudad));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-1-UNIT-BE-2 (P1) — Create() throws on whitespace-only Nombre
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-1-UNIT-BE-2 (P1)
    /// GIVEN a whitespace-only string for Nombre ("   ")
    /// WHEN ClienteEntity.Create() is called
    /// THEN ArgumentException is thrown (ArgumentException.ThrowIfNullOrWhiteSpace behaviour)
    /// </summary>
    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("\t")]
    public void Create_WhenNombreIsWhitespace_ThrowsArgumentException(string whitespace)
    {
        // GIVEN / WHEN / THEN
        Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create(whitespace, ValidNit, ValidTelefono, ValidCiudad));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-1-UNIT-BE-3 (P1) — Create() throws on null NIT
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-1-UNIT-BE-3 (P1)
    /// GIVEN a null value for NIT
    /// WHEN ClienteEntity.Create() is called
    /// THEN ArgumentException is thrown
    /// </summary>
    [Fact]
    public void Create_WhenNitIsNull_ThrowsArgumentException()
    {
        Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create(ValidNombre, null!, ValidTelefono, ValidCiudad));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-1-UNIT-BE-4 (P1) — Create() throws on whitespace-only NIT
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-1-UNIT-BE-4 (P1)
    /// GIVEN a whitespace-only string for NIT
    /// WHEN ClienteEntity.Create() is called
    /// THEN ArgumentException is thrown
    /// </summary>
    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WhenNitIsWhitespace_ThrowsArgumentException(string whitespace)
    {
        Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create(ValidNombre, whitespace, ValidTelefono, ValidCiudad));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-1-UNIT-BE-5 (P1) — Create() throws on null Telefono
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-1-UNIT-BE-5 (P1)
    /// GIVEN a null value for Telefono
    /// WHEN ClienteEntity.Create() is called
    /// THEN ArgumentException is thrown
    /// </summary>
    [Fact]
    public void Create_WhenTelefonoIsNull_ThrowsArgumentException()
    {
        Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create(ValidNombre, ValidNit, null!, ValidCiudad));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-1-UNIT-BE-6 (P1) — Create() throws on null Ciudad
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-1-UNIT-BE-6 (P1)
    /// GIVEN a null value for Ciudad
    /// WHEN ClienteEntity.Create() is called
    /// THEN ArgumentException is thrown
    /// </summary>
    [Fact]
    public void Create_WhenCiudadIsNull_ThrowsArgumentException()
    {
        Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create(ValidNombre, ValidNit, ValidTelefono, null!));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-1-UNIT-BE-7 (P2) — Create() trims whitespace from all fields
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-1-UNIT-BE-7 (P2)
    /// GIVEN fields with leading/trailing whitespace
    /// WHEN ClienteEntity.Create() is called
    /// THEN all stored values are trimmed
    /// </summary>
    [Fact]
    public void Create_WhenFieldsHaveLeadingTrailingWhitespace_StoresTrimmedValues()
    {
        // GIVEN: All fields with surrounding whitespace
        var entity = ClienteEntity.Create(
            "  Acme S.A.  ",
            "  900123456-1  ",
            "  3001234567  ",
            "  Bogotá  ");

        // THEN: All fields are trimmed
        Assert.Equal("Acme S.A.", entity.Nombre);
        Assert.Equal("900123456-1", entity.Nit);
        Assert.Equal("3001234567", entity.Telefono);
        Assert.Equal("Bogotá", entity.Ciudad);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-1-UNIT-BE-8 (P2) — Create() sets DateTimeOffset on CreatedAt
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-1-UNIT-BE-8 (P2)
    /// GIVEN valid arguments
    /// WHEN ClienteEntity.Create() is called
    /// THEN CreatedAt and UpdatedAt are set to a recent UTC DateTimeOffset
    /// </summary>
    [Fact]
    public void Create_WhenValidArguments_SetsRecentUtcDateTimeOffsetTimestamps()
    {
        // GIVEN: Current time reference
        var before = DateTimeOffset.UtcNow.AddSeconds(-1);

        // WHEN: Entity created
        var entity = ClienteEntity.Create(ValidNombre, ValidNit, ValidTelefono, ValidCiudad);

        var after = DateTimeOffset.UtcNow.AddSeconds(1);

        // THEN: CreatedAt is within the expected time window
        Assert.InRange(entity.CreatedAt, before, after);
        Assert.InRange(entity.UpdatedAt, before, after);
        // CRITICAL: Verify DateTimeOffset, not DateTime (project enforcement rule)
        Assert.Equal(TimeSpan.Zero, entity.CreatedAt.Offset);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-1-UNIT-BE-9 (P2) — Create() generates a non-empty Guid Id
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-1-UNIT-BE-9 (P2)
    /// GIVEN valid arguments
    /// WHEN ClienteEntity.Create() is called
    /// THEN the entity has a non-empty Guid Id, and two entities have distinct Ids
    /// </summary>
    [Fact]
    public void Create_WhenCalledTwice_ProducesTwoDistinctNonEmptyGuids()
    {
        // GIVEN / WHEN
        var e1 = ClienteEntity.Create(ValidNombre, ValidNit, ValidTelefono, ValidCiudad);
        var e2 = ClienteEntity.Create(ValidNombre + "2", ValidNit + "X", ValidTelefono, ValidCiudad);

        // THEN: IDs are non-empty and unique
        Assert.NotEqual(Guid.Empty, e1.Id);
        Assert.NotEqual(Guid.Empty, e2.Id);
        Assert.NotEqual(e1.Id, e2.Id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-1-UNIT-BE-10 (P2) — Update() overwrites fields and refreshes UpdatedAt
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-1-UNIT-BE-10 (P2)
    /// GIVEN a ClienteEntity created with initial values
    /// WHEN Update() is called with new values
    /// THEN all mutable fields reflect the new values, UpdatedAt is refreshed, Id and CreatedAt are unchanged
    /// </summary>
    [Fact]
    public async Task Update_WhenCalledWithNewValues_OverwritesFieldsAndRefreshesUpdatedAt()
    {
        // GIVEN: Entity with initial values
        var entity = ClienteEntity.Create(ValidNombre, ValidNit, ValidTelefono, ValidCiudad);
        var originalId = entity.Id;
        var originalCreatedAt = entity.CreatedAt;
        var originalUpdatedAt = entity.UpdatedAt;

        // Small delay so UpdatedAt will differ measurably
        await Task.Delay(10);

        // WHEN: Update() called with new values
        entity.Update("Beta Corp", "811999888-9", "3109998887", "Medellín");

        // THEN: Mutable fields updated
        Assert.Equal("Beta Corp", entity.Nombre);
        Assert.Equal("811999888-9", entity.Nit);
        Assert.Equal("3109998887", entity.Telefono);
        Assert.Equal("Medellín", entity.Ciudad);

        // AND: Immutable fields unchanged
        Assert.Equal(originalId, entity.Id);
        Assert.Equal(originalCreatedAt, entity.CreatedAt);

        // AND: UpdatedAt refreshed (greater than original)
        Assert.True(entity.UpdatedAt > originalUpdatedAt,
            $"UpdatedAt ({entity.UpdatedAt}) should be greater than original ({originalUpdatedAt})");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Bonus edge case: Update() trims whitespace
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// GIVEN a ClienteEntity and new field values with leading/trailing whitespace
    /// WHEN Update() is called
    /// THEN stored values are trimmed
    /// </summary>
    [Fact]
    public void Update_WhenFieldsHaveLeadingTrailingWhitespace_StoresTrimmedValues()
    {
        // GIVEN
        var entity = ClienteEntity.Create(ValidNombre, ValidNit, ValidTelefono, ValidCiudad);

        // WHEN
        entity.Update("  Beta Corp  ", "  811999888-9  ", "  3109998887  ", "  Medellín  ");

        // THEN
        Assert.Equal("Beta Corp", entity.Nombre);
        Assert.Equal("811999888-9", entity.Nit);
        Assert.Equal("3109998887", entity.Telefono);
        Assert.Equal("Medellín", entity.Ciudad);
    }
}
