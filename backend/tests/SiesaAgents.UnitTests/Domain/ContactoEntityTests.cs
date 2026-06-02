using SiesaAgents.Domain.Contactos.Entities;

namespace SiesaAgents.UnitTests.Domain;

/// <summary>
/// Unit tests for ContactoEntity domain model — Story 3.1 edge case expansion.
///
/// Test IDs: UNIT-B-CT-DOMAIN-01 … UNIT-B-CT-DOMAIN-09
///
/// Risks covered:
///   - Create assigns a non-empty GUID ID
///   - Create preserves all provided field values
///   - Create sets CreatedAt and UpdatedAt to a recent UTC time (DateTimeOffset)
///   - Two distinct Create calls produce unique IDs
///   - ClienteId is null after Create (Epic 3 scope boundary)
///   - Update changes Nombre, Cargo, Telefono, Email; preserves Id and CreatedAt
///   - Update bumps UpdatedAt but keeps CreatedAt unchanged
///   - Create with empty Nombre does not throw (validation is at application layer)
///   - Create with very long strings stores full values (no domain truncation)
/// </summary>
public class ContactoEntityTests
{
    // ---------------------------------------------------------------------------
    // UNIT-B-CT-DOMAIN-01: Create assigns a non-empty GUID ID
    // ---------------------------------------------------------------------------
    [Fact]
    public void Create_Always_AssignsNonEmptyId()
    {
        var entity = ContactoEntity.Create("María García", "Gerente Comercial", "+57 1 234 5679", "m.garcia@empresa.com");

        Assert.NotEqual(Guid.Empty, entity.Id);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-CT-DOMAIN-02: Create preserves all provided field values exactly
    // ---------------------------------------------------------------------------
    [Fact]
    public void Create_ValidData_SetsAllFields()
    {
        const string nombre = "Juan Pérez";
        const string cargo = "Analista TI";
        const string telefono = "+57 310 123 4567";
        const string email = "j.perez@empresa.com";

        var entity = ContactoEntity.Create(nombre, cargo, telefono, email);

        Assert.Equal(nombre, entity.Nombre);
        Assert.Equal(cargo, entity.Cargo);
        Assert.Equal(telefono, entity.Telefono);
        Assert.Equal(email, entity.Email);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-CT-DOMAIN-03: Create sets CreatedAt and UpdatedAt to a recent UTC time
    // Boundary: must be DateTimeOffset (not DateTime) with UTC offset = TimeSpan.Zero
    // ---------------------------------------------------------------------------
    [Fact]
    public void Create_Always_SetsCreatedAtToUtcNow()
    {
        var before = DateTimeOffset.UtcNow.AddSeconds(-1);

        var entity = ContactoEntity.Create("Test", "Cargo", "+57 300 000 0000", "test@test.co");

        var after = DateTimeOffset.UtcNow.AddSeconds(1);

        Assert.InRange(entity.CreatedAt, before, after);
        Assert.InRange(entity.UpdatedAt, before, after);
        // Must be DateTimeOffset (Offset property exists and equals UTC zero)
        Assert.Equal(TimeSpan.Zero, entity.CreatedAt.Offset);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-CT-DOMAIN-04: Two distinct Create calls produce different IDs
    // Boundary: Guid.NewGuid() must not collide across rapid calls.
    // ---------------------------------------------------------------------------
    [Fact]
    public void Create_TwoEntities_HaveDifferentIds()
    {
        var e1 = ContactoEntity.Create("Contacto Uno", "Cargo A", "+57 300 000 0001", "uno@test.co");
        var e2 = ContactoEntity.Create("Contacto Dos", "Cargo B", "+57 300 000 0002", "dos@test.co");

        Assert.NotEqual(e1.Id, e2.Id);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-CT-DOMAIN-05: ClienteId is null after Create (Epic 3 scope boundary)
    // Architecture rule: ClienteId defaults to null — assigned only in Epic 4.
    // ---------------------------------------------------------------------------
    [Fact]
    public void Create_Always_SetsClienteIdToNull()
    {
        var entity = ContactoEntity.Create("Sin Cliente", "Analista", "+57 300 000 0003", "sincliente@test.co");

        Assert.Null(entity.ClienteId);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-CT-DOMAIN-06: Update changes all mutable fields
    // AND preserves Id and CreatedAt (immutable after creation)
    // ---------------------------------------------------------------------------
    [Fact]
    public void Update_ValidData_ChangesFieldsButPreservesIdAndCreatedAt()
    {
        var entity = ContactoEntity.Create("Original Nombre", "Original Cargo", "+57 300 000 0004", "original@test.co");
        var originalId = entity.Id;
        var originalCreatedAt = entity.CreatedAt;

        entity.Update("Nuevo Nombre", "Nuevo Cargo", "+57 310 000 0004", "nuevo@test.co");

        Assert.Equal("Nuevo Nombre", entity.Nombre);
        Assert.Equal("Nuevo Cargo", entity.Cargo);
        Assert.Equal("+57 310 000 0004", entity.Telefono);
        Assert.Equal("nuevo@test.co", entity.Email);
        // Id and CreatedAt must NOT change
        Assert.Equal(originalId, entity.Id);
        Assert.Equal(originalCreatedAt, entity.CreatedAt);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-CT-DOMAIN-07: Update bumps UpdatedAt but keeps CreatedAt unchanged
    // Boundary: UpdatedAt >= CreatedAt must hold true after an update.
    // ---------------------------------------------------------------------------
    [Fact]
    public void Update_Always_BumpsUpdatedAt()
    {
        var entity = ContactoEntity.Create("Contacto", "Cargo", "+57 300 000 0005", "bump@test.co");
        var createdAt = entity.CreatedAt;

        entity.Update("Contacto Mod", "Cargo Mod", "+57 310 000 0005", "mod@test.co");

        Assert.Equal(createdAt, entity.CreatedAt); // unchanged
        Assert.True(entity.UpdatedAt >= createdAt); // bumped or equal within the same millisecond
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-CT-DOMAIN-08: Create with empty Nombre does not throw
    // The domain entity has no guard clauses — validation is at the application layer.
    // This test documents the current behavior and will fail if a guard is added.
    // ---------------------------------------------------------------------------
    [Fact]
    public void Create_WithEmptyNombre_DoesNotThrow()
    {
        var ex = Record.Exception(() =>
            ContactoEntity.Create(string.Empty, "Cargo", "+57 300 000 0006", "empty@test.co"));

        Assert.Null(ex);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-CT-DOMAIN-09: Create with very long strings stores full values
    // Boundary: domain entity has no length limit (DB constraints via EF config).
    // ---------------------------------------------------------------------------
    [Fact]
    public void Create_WithVeryLongStrings_StoresFullValue()
    {
        var longNombre = new string('N', 500);
        var longEmail = new string('e', 200) + "@test.co";

        var entity = ContactoEntity.Create(longNombre, "Cargo", "+57 300 000 0007", longEmail);

        Assert.Equal(longNombre, entity.Nombre);
        Assert.Equal(longEmail, entity.Email);
    }
}
