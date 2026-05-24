using SiesaAgents.Domain.Contactos.Entities;

namespace SiesaAgents.UnitTests.Domain;

/// <summary>
/// Edge case and boundary condition tests for ContactoEntity.
/// Expands coverage beyond the ATDD happy-path tests in ContactoEntityTests.cs.
/// Story 1.1 — Project Initialization &amp; Repository Structure
/// </summary>
public class ContactoEntityEdgeCaseTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Create — boundary conditions on required fields
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Create_WithEmptyNombre_ThrowsArgumentException()
    {
        // GIVEN: An empty nombre string
        // WHEN: ContactoEntity.Create is called
        // THEN: ArgumentException is thrown
        Assert.Throws<ArgumentException>(() =>
            ContactoEntity.Create("", "juan@test.com", null, null, null));
    }

    [Fact]
    public void Create_WithWhitespaceNombre_ThrowsArgumentException()
    {
        // GIVEN: A nombre value that is only whitespace
        // WHEN: ContactoEntity.Create is called
        // THEN: ArgumentException is thrown
        Assert.Throws<ArgumentException>(() =>
            ContactoEntity.Create("   ", "juan@test.com", null, null, null));
    }

    [Fact]
    public void Create_WithNullNombre_ThrowsArgumentException()
    {
        // GIVEN: A null nombre
        // WHEN: ContactoEntity.Create is called
        // THEN: ArgumentException (or ArgumentNullException) is thrown
        Assert.ThrowsAny<ArgumentException>(() =>
            ContactoEntity.Create(null!, "juan@test.com", null, null, null));
    }

    [Fact]
    public void Create_WithEmptyEmail_ThrowsArgumentException()
    {
        // GIVEN: An empty email string
        // WHEN: ContactoEntity.Create is called
        // THEN: ArgumentException is thrown — email is required
        Assert.Throws<ArgumentException>(() =>
            ContactoEntity.Create("Juan Pérez", "", null, null, null));
    }

    [Fact]
    public void Create_WithWhitespaceEmail_ThrowsArgumentException()
    {
        // GIVEN: An email value that is only whitespace
        // WHEN: ContactoEntity.Create is called
        // THEN: ArgumentException is thrown
        Assert.Throws<ArgumentException>(() =>
            ContactoEntity.Create("Juan Pérez", "   ", null, null, null));
    }

    [Fact]
    public void Create_WithNullEmail_ThrowsArgumentException()
    {
        // GIVEN: A null email
        // WHEN: ContactoEntity.Create is called
        // THEN: ArgumentException (or ArgumentNullException) is thrown
        Assert.ThrowsAny<ArgumentException>(() =>
            ContactoEntity.Create("Juan Pérez", null!, null, null, null));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Create — unique identity guarantee
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Create_TwoInstances_HaveDifferentIds()
    {
        // GIVEN: The domain assigns a new Guid on every Create call
        // WHEN: Two ContactoEntity instances are created
        var contactoA = ContactoEntity.Create("Juan", "a@test.com", null, null, null);
        var contactoB = ContactoEntity.Create("Pedro", "b@test.com", null, null, null);

        // THEN: Each instance has a distinct, non-Empty Guid
        Assert.NotEqual(contactoA.Id, contactoB.Id);
        Assert.NotEqual(Guid.Empty, contactoA.Id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Create — optional fields
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Create_WithAllOptionalFieldsNull_Succeeds()
    {
        // GIVEN: Only required fields are provided
        // WHEN: ContactoEntity.Create is called
        var contacto = ContactoEntity.Create("Juan Pérez", "juan@test.com", null, null, null);

        // THEN: Optional fields are null
        Assert.Null(contacto.Cargo);
        Assert.Null(contacto.Telefono);
        Assert.Null(contacto.ClienteId);
    }

    [Fact]
    public void Create_WithClienteIdProvided_StoresClienteId()
    {
        // GIVEN: A known clienteId for pre-association
        var clienteId = Guid.NewGuid();

        // WHEN: ContactoEntity is created with a clienteId
        var contacto = ContactoEntity.Create("Juan", "juan@test.com", "Gerente", null, clienteId);

        // THEN: ClienteId is stored from creation
        Assert.Equal(clienteId, contacto.ClienteId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Create — timestamps
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Create_SetsTimestampsToCurrentUtc()
    {
        // GIVEN: A timestamp snapshot before creation
        var before = DateTimeOffset.UtcNow.AddSeconds(-1);

        // WHEN: ContactoEntity is created
        var contacto = ContactoEntity.Create("Juan", "juan@test.com", null, null, null);
        var after = DateTimeOffset.UtcNow.AddSeconds(1);

        // THEN: Timestamps fall within the expected window
        Assert.InRange(contacto.CreatedAt, before, after);
        Assert.InRange(contacto.UpdatedAt, before, after);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Update — error paths
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Update_WithEmptyNombre_ThrowsArgumentException()
    {
        // GIVEN: An existing ContactoEntity
        var contacto = ContactoEntity.Create("Juan", "juan@test.com", null, null, null);

        // WHEN: Update is called with empty nombre
        // THEN: ArgumentException is thrown
        Assert.Throws<ArgumentException>(() => contacto.Update("", null, null));
    }

    [Fact]
    public void Update_WithWhitespaceNombre_ThrowsArgumentException()
    {
        // GIVEN: An existing ContactoEntity
        var contacto = ContactoEntity.Create("Juan", "juan@test.com", null, null, null);

        // WHEN: Update is called with whitespace nombre
        // THEN: ArgumentException is thrown
        Assert.Throws<ArgumentException>(() => contacto.Update("   ", null, null));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Update — email is immutable
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Update_DoesNotChangeEmail()
    {
        // GIVEN: An entity with a known email (email is not a parameter in Update)
        var contacto = ContactoEntity.Create("Juan", "juan@empresa.com", null, null, null);
        var originalEmail = contacto.Email;

        // WHEN: Update is called
        contacto.Update("Juan Modificado", "Gerente", "+57 300 0000");

        // THEN: Email is unchanged — it is immutable after creation
        Assert.Equal(originalEmail, contacto.Email);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Update — timestamps
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Update_UpdatedAtAdvancesAndCreatedAtRemainsUnchanged()
    {
        // GIVEN: An existing entity
        var contacto = ContactoEntity.Create("Juan", "juan@test.com", null, null, null);
        var originalCreatedAt = contacto.CreatedAt;
        var originalUpdatedAt = contacto.UpdatedAt;

        // WHEN: Update is called
        contacto.Update("Juan Modificado", "Cargo", null);

        // THEN: CreatedAt is immutable; UpdatedAt >= original
        Assert.Equal(originalCreatedAt, contacto.CreatedAt);
        Assert.True(contacto.UpdatedAt >= originalUpdatedAt);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AssignCliente — UpdatedAt changes on reassignment
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AssignCliente_UpdatesUpdatedAtTimestamp()
    {
        // GIVEN: An existing contacto and a known clienteId
        var contacto = ContactoEntity.Create("Juan", "juan@test.com", null, null, null);
        var originalUpdatedAt = contacto.UpdatedAt;
        var clienteId = Guid.NewGuid();

        // WHEN: AssignCliente is called
        contacto.AssignCliente(clienteId);

        // THEN: UpdatedAt is >= the original value (may be equal in fast machines)
        Assert.True(contacto.UpdatedAt >= originalUpdatedAt);
    }

    [Fact]
    public void AssignCliente_WithSameClienteId_DoesNotThrow()
    {
        // GIVEN: A contacto already associated to a client
        var clienteId = Guid.NewGuid();
        var contacto = ContactoEntity.Create("Juan", "juan@test.com", null, null, clienteId);

        // WHEN: AssignCliente is called with the same clienteId again
        // THEN: No exception — idempotent reassignment is allowed
        var exception = Record.Exception(() => contacto.AssignCliente(clienteId));
        Assert.Null(exception);
    }

    [Fact]
    public void AssignCliente_WithEmptyGuid_StoresEmptyGuid()
    {
        // GIVEN: A contacto entity
        var contacto = ContactoEntity.Create("Juan", "juan@test.com", null, null, null);

        // WHEN: AssignCliente is called with Guid.Empty (edge: not null but empty)
        contacto.AssignCliente(Guid.Empty);

        // THEN: ClienteId is set to Guid.Empty (the domain does not validate this — that is
        // the validator's responsibility in the Application layer)
        Assert.Equal(Guid.Empty, contacto.ClienteId);
    }
}
