using SiesaAgents.Domain.Contactos.Entities;
using Xunit;

namespace SiesaAgents.UnitTests.Contactos;

/// <summary>
/// Unit tests — ContactoEntity domain model (edge cases and boundary conditions).
/// Story 3.1 automation expansion.
///
/// Test IDs:
///   TC-E3-3-1-UNIT-BE-1 (P1) — Create() throws on null Nombre
///   TC-E3-3-1-UNIT-BE-2 (P1) — Create() throws on whitespace-only Nombre
///   TC-E3-3-1-UNIT-BE-3 (P1) — Create() throws on null Cargo
///   TC-E3-3-1-UNIT-BE-4 (P1) — Create() throws on null Telefono
///   TC-E3-3-1-UNIT-BE-5 (P1) — Create() throws on null Email
///   TC-E3-3-1-UNIT-BE-6 (P2) — Create() trims leading/trailing whitespace from all fields
///   TC-E3-3-1-UNIT-BE-7 (P2) — Create() sets DateTimeOffset (not DateTime) on CreatedAt/UpdatedAt
///   TC-E3-3-1-UNIT-BE-8 (P2) — Create() generates a non-empty Guid Id; two calls produce distinct Ids
///   TC-E3-3-1-UNIT-BE-9 (P2) — Update() overwrites all mutable fields and refreshes UpdatedAt
///   TC-E3-3-1-UNIT-BE-10 (P2) — ClienteId is null by default (not yet assigned)
/// </summary>
public class ContactoEntityTests
{
    private const string ValidNombre = "María López";
    private const string ValidCargo = "Gerente Comercial";
    private const string ValidTelefono = "3001234567";
    private const string ValidEmail = "maria.lopez@empresa.co";

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-1-UNIT-BE-1 (P1) — Create() throws on null Nombre
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-1-UNIT-BE-1 (P1)
    /// GIVEN a null value for Nombre
    /// WHEN ContactoEntity.Create() is called
    /// THEN ArgumentException is thrown
    /// </summary>
    [Fact]
    public void Create_WhenNombreIsNull_ThrowsArgumentException()
    {
        // GIVEN / WHEN / THEN
        Assert.Throws<ArgumentException>(() =>
            ContactoEntity.Create(null!, ValidCargo, ValidTelefono, ValidEmail));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-1-UNIT-BE-2 (P1) — Create() throws on whitespace-only Nombre
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-1-UNIT-BE-2 (P1)
    /// GIVEN whitespace-only strings for Nombre
    /// WHEN ContactoEntity.Create() is called
    /// THEN ArgumentException is thrown (ArgumentException.ThrowIfNullOrWhiteSpace behaviour)
    /// </summary>
    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("\t")]
    [InlineData("\n")]
    public void Create_WhenNombreIsWhitespace_ThrowsArgumentException(string whitespace)
    {
        // GIVEN / WHEN / THEN
        Assert.Throws<ArgumentException>(() =>
            ContactoEntity.Create(whitespace, ValidCargo, ValidTelefono, ValidEmail));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-1-UNIT-BE-3 (P1) — Create() throws on null Cargo
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-1-UNIT-BE-3 (P1)
    /// GIVEN a null value for Cargo
    /// WHEN ContactoEntity.Create() is called
    /// THEN ArgumentException is thrown
    /// </summary>
    [Fact]
    public void Create_WhenCargoIsNull_ThrowsArgumentException()
    {
        Assert.Throws<ArgumentException>(() =>
            ContactoEntity.Create(ValidNombre, null!, ValidTelefono, ValidEmail));
    }

    /// <summary>
    /// GIVEN whitespace-only strings for Cargo
    /// WHEN ContactoEntity.Create() is called
    /// THEN ArgumentException is thrown
    /// </summary>
    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WhenCargoIsWhitespace_ThrowsArgumentException(string whitespace)
    {
        Assert.Throws<ArgumentException>(() =>
            ContactoEntity.Create(ValidNombre, whitespace, ValidTelefono, ValidEmail));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-1-UNIT-BE-4 (P1) — Create() throws on null Telefono
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-1-UNIT-BE-4 (P1)
    /// GIVEN a null value for Telefono
    /// WHEN ContactoEntity.Create() is called
    /// THEN ArgumentException is thrown
    /// </summary>
    [Fact]
    public void Create_WhenTelefonoIsNull_ThrowsArgumentException()
    {
        Assert.Throws<ArgumentException>(() =>
            ContactoEntity.Create(ValidNombre, ValidCargo, null!, ValidEmail));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-1-UNIT-BE-5 (P1) — Create() throws on null Email
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-1-UNIT-BE-5 (P1)
    /// GIVEN a null value for Email
    /// WHEN ContactoEntity.Create() is called
    /// THEN ArgumentException is thrown
    /// </summary>
    [Fact]
    public void Create_WhenEmailIsNull_ThrowsArgumentException()
    {
        Assert.Throws<ArgumentException>(() =>
            ContactoEntity.Create(ValidNombre, ValidCargo, ValidTelefono, null!));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-1-UNIT-BE-6 (P2) — Create() trims whitespace from all fields
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-1-UNIT-BE-6 (P2)
    /// GIVEN fields with leading/trailing whitespace
    /// WHEN ContactoEntity.Create() is called
    /// THEN all stored values are trimmed
    /// </summary>
    [Fact]
    public void Create_WhenFieldsHaveLeadingTrailingWhitespace_StoresTrimmedValues()
    {
        // GIVEN: All fields with surrounding whitespace
        var entity = ContactoEntity.Create(
            "  María López  ",
            "  Gerente Comercial  ",
            "  3001234567  ",
            "  maria.lopez@empresa.co  ");

        // THEN: All fields are trimmed
        Assert.Equal("María López", entity.Nombre);
        Assert.Equal("Gerente Comercial", entity.Cargo);
        Assert.Equal("3001234567", entity.Telefono);
        Assert.Equal("maria.lopez@empresa.co", entity.Email);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-1-UNIT-BE-7 (P2) — Create() sets DateTimeOffset on timestamps
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-1-UNIT-BE-7 (P2)
    /// GIVEN valid arguments
    /// WHEN ContactoEntity.Create() is called
    /// THEN CreatedAt and UpdatedAt are set to a recent UTC DateTimeOffset
    /// (enforcement rule: NEVER DateTime — always DateTimeOffset)
    /// </summary>
    [Fact]
    public void Create_WhenValidArguments_SetsRecentUtcDateTimeOffsetTimestamps()
    {
        // GIVEN: Current time reference window
        var before = DateTimeOffset.UtcNow.AddSeconds(-1);

        // WHEN: Entity created
        var entity = ContactoEntity.Create(ValidNombre, ValidCargo, ValidTelefono, ValidEmail);

        var after = DateTimeOffset.UtcNow.AddSeconds(1);

        // THEN: CreatedAt is within the expected time window
        Assert.InRange(entity.CreatedAt, before, after);
        Assert.InRange(entity.UpdatedAt, before, after);

        // CRITICAL: Verify DateTimeOffset offset is UTC (project enforcement rule: use DateTimeOffset not DateTime)
        Assert.Equal(TimeSpan.Zero, entity.CreatedAt.Offset);
        Assert.Equal(TimeSpan.Zero, entity.UpdatedAt.Offset);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-1-UNIT-BE-8 (P2) — Create() generates non-empty Guid Id
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-1-UNIT-BE-8 (P2)
    /// GIVEN valid arguments
    /// WHEN ContactoEntity.Create() is called twice
    /// THEN each entity has a non-empty Guid Id, and the two Ids are distinct
    /// </summary>
    [Fact]
    public void Create_WhenCalledTwice_ProducesTwoDistinctNonEmptyGuids()
    {
        // GIVEN / WHEN
        var e1 = ContactoEntity.Create(ValidNombre, ValidCargo, ValidTelefono, ValidEmail);
        var e2 = ContactoEntity.Create("Juan Rodríguez", "Analista", "3001111111", "juan@test.co");

        // THEN: IDs are non-empty and unique
        Assert.NotEqual(Guid.Empty, e1.Id);
        Assert.NotEqual(Guid.Empty, e2.Id);
        Assert.NotEqual(e1.Id, e2.Id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-1-UNIT-BE-9 (P2) — Update() overwrites fields and refreshes UpdatedAt
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-1-UNIT-BE-9 (P2)
    /// GIVEN a ContactoEntity created with initial values
    /// WHEN Update() is called with new values
    /// THEN all mutable fields reflect the new values, UpdatedAt is refreshed,
    /// AND Id, ClienteId, and CreatedAt remain unchanged
    /// </summary>
    [Fact]
    public async Task Update_WhenCalledWithNewValues_OverwritesFieldsAndRefreshesUpdatedAt()
    {
        // GIVEN: Entity with initial values
        var entity = ContactoEntity.Create(ValidNombre, ValidCargo, ValidTelefono, ValidEmail);
        var originalId = entity.Id;
        var originalClienteId = entity.ClienteId;
        var originalCreatedAt = entity.CreatedAt;
        var originalUpdatedAt = entity.UpdatedAt;

        // Small delay so UpdatedAt will differ measurably
        await Task.Delay(10);

        // WHEN: Update() called with new values
        entity.Update("Juan Rodríguez", "Director Comercial", "3109998887", "juan.rodriguez@empresa.co");

        // THEN: Mutable fields updated
        Assert.Equal("Juan Rodríguez", entity.Nombre);
        Assert.Equal("Director Comercial", entity.Cargo);
        Assert.Equal("3109998887", entity.Telefono);
        Assert.Equal("juan.rodriguez@empresa.co", entity.Email);

        // AND: Immutable fields unchanged
        Assert.Equal(originalId, entity.Id);
        Assert.Equal(originalClienteId, entity.ClienteId); // still null
        Assert.Equal(originalCreatedAt, entity.CreatedAt);

        // AND: UpdatedAt refreshed (strictly greater than original)
        Assert.True(entity.UpdatedAt > originalUpdatedAt,
            $"UpdatedAt ({entity.UpdatedAt}) should be greater than original ({originalUpdatedAt})");
    }

    /// <summary>
    /// GIVEN a ContactoEntity and new field values with leading/trailing whitespace
    /// WHEN Update() is called
    /// THEN stored values are trimmed
    /// </summary>
    [Fact]
    public void Update_WhenFieldsHaveLeadingTrailingWhitespace_StoresTrimmedValues()
    {
        // GIVEN
        var entity = ContactoEntity.Create(ValidNombre, ValidCargo, ValidTelefono, ValidEmail);

        // WHEN
        entity.Update("  Ana Gómez  ", "  Coordinadora  ", "  3112223344  ", "  ana.gomez@test.co  ");

        // THEN
        Assert.Equal("Ana Gómez", entity.Nombre);
        Assert.Equal("Coordinadora", entity.Cargo);
        Assert.Equal("3112223344", entity.Telefono);
        Assert.Equal("ana.gomez@test.co", entity.Email);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-1-UNIT-BE-10 (P2) — ClienteId is null by default
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-1-UNIT-BE-10 (P2)
    /// GIVEN valid arguments (no ClienteId)
    /// WHEN ContactoEntity.Create() is called
    /// THEN ClienteId is null (contact not yet associated with a client — Epic 4 assigns it)
    /// </summary>
    [Fact]
    public void Create_WhenNoClienteIdProvided_ClienteIdIsNull()
    {
        // GIVEN / WHEN
        var entity = ContactoEntity.Create(ValidNombre, ValidCargo, ValidTelefono, ValidEmail);

        // THEN: ClienteId is null by default (nullable FK per story requirement)
        Assert.Null(entity.ClienteId);
    }
}
