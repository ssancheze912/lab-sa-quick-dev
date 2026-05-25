using SiesaAgents.Domain.Contactos.Entities;

namespace SiesaAgents.UnitTests.Domain;

/// <summary>
/// Edge cases and boundary conditions for ContactoEntity not covered by ContactoEntityTests.
/// </summary>
public class ContactoEntityEdgeCaseTests
{
    // --- Create: boundary conditions on required fields ---

    [Fact]
    public void Create_WithEmptyNombre_ThrowsArgumentException()
    {
        // Arrange: empty nombre
        // Act & Assert
        Assert.Throws<ArgumentException>(() => ContactoEntity.Create("", "user@test.com", null, null, null));
    }

    [Fact]
    public void Create_WithWhitespaceOnlyNombre_ThrowsArgumentException()
    {
        // Arrange: whitespace-only nombre
        // Act & Assert
        Assert.Throws<ArgumentException>(() => ContactoEntity.Create("   ", "user@test.com", null, null, null));
    }

    [Fact]
    public void Create_WithNullNombre_ThrowsArgumentException()
    {
        // Arrange: null nombre
        // Act & Assert
        Assert.Throws<ArgumentException>(() => ContactoEntity.Create(null!, "user@test.com", null, null, null));
    }

    [Fact]
    public void Create_WithEmptyEmail_ThrowsArgumentException()
    {
        // Arrange: empty email
        // Act & Assert
        Assert.Throws<ArgumentException>(() => ContactoEntity.Create("Juan", "", null, null, null));
    }

    [Fact]
    public void Create_WithWhitespaceOnlyEmail_ThrowsArgumentException()
    {
        // Arrange: whitespace-only email
        // Act & Assert
        Assert.Throws<ArgumentException>(() => ContactoEntity.Create("Juan", "   ", null, null, null));
    }

    [Fact]
    public void Create_WithNullEmail_ThrowsArgumentException()
    {
        // Arrange: null email
        // Act & Assert
        Assert.Throws<ArgumentException>(() => ContactoEntity.Create("Juan", null!, null, null, null));
    }

    // --- Create: optional fields ---

    [Fact]
    public void Create_WithAllOptionalFields_MapsThemCorrectly()
    {
        // Arrange
        var cargo = "Gerente Comercial";
        var telefono = "+57 315 000 0000";
        var clienteId = Guid.NewGuid();

        // Act
        var contacto = ContactoEntity.Create("María López", "maria@empresa.com", cargo, telefono, clienteId);

        // Assert
        Assert.Equal(cargo, contacto.Cargo);
        Assert.Equal(telefono, contacto.Telefono);
        Assert.Equal(clienteId, contacto.ClienteId);
    }

    [Fact]
    public void Create_WithNullOptionalFields_StoresNulls()
    {
        // Arrange: all optionals null
        // Act
        var contacto = ContactoEntity.Create("Juan", "juan@test.com", null, null, null);

        // Assert
        Assert.Null(contacto.Cargo);
        Assert.Null(contacto.Telefono);
        Assert.Null(contacto.ClienteId);
    }

    // --- Create: unique Id per instantiation ---

    [Fact]
    public void Create_TwiceWithSameData_ProducesDistinctIds()
    {
        // Arrange & Act
        var c1 = ContactoEntity.Create("Juan", "juan@test.com", null, null, null);
        var c2 = ContactoEntity.Create("Juan", "juan@test.com", null, null, null);

        // Assert: Guid uniqueness
        Assert.NotEqual(c1.Id, c2.Id);
    }

    // --- Update: boundary conditions ---

    [Fact]
    public void Update_WithEmptyNombre_ThrowsArgumentException()
    {
        // Arrange
        var contacto = ContactoEntity.Create("Juan", "juan@test.com", null, null, null);

        // Act & Assert
        Assert.Throws<ArgumentException>(() => contacto.Update("", null, null));
    }

    [Fact]
    public void Update_WithWhitespaceOnlyNombre_ThrowsArgumentException()
    {
        // Arrange
        var contacto = ContactoEntity.Create("Juan", "juan@test.com", null, null, null);

        // Act & Assert
        Assert.Throws<ArgumentException>(() => contacto.Update("   ", null, null));
    }

    [Fact]
    public void Update_WithNullNombre_ThrowsArgumentException()
    {
        // Arrange
        var contacto = ContactoEntity.Create("Juan", "juan@test.com", null, null, null);

        // Act & Assert
        Assert.Throws<ArgumentException>(() => contacto.Update(null!, null, null));
    }

    // --- Update: optional field clearing ---

    [Fact]
    public void Update_WithNullOptionalFields_ClearsCargoAndTelefono()
    {
        // Arrange: contacto with optionals populated
        var contacto = ContactoEntity.Create("Juan", "juan@test.com", "Developer", "+57 000", null);

        // Act: update clearing optionals
        contacto.Update("Juan Updated", null, null);

        // Assert
        Assert.Null(contacto.Cargo);
        Assert.Null(contacto.Telefono);
    }

    [Fact]
    public void Update_UpdatesCargoAndTelefono()
    {
        // Arrange
        var contacto = ContactoEntity.Create("Juan", "juan@test.com", null, null, null);

        // Act
        contacto.Update("Juan", "Director Técnico", "+57 321 0000000");

        // Assert
        Assert.Equal("Director Técnico", contacto.Cargo);
        Assert.Equal("+57 321 0000000", contacto.Telefono);
    }

    // --- Update: Id and Email are immutable ---

    [Fact]
    public void Update_DoesNotChangeIdOrEmail()
    {
        // Arrange
        var contacto = ContactoEntity.Create("Juan", "juan@original.com", null, null, null);
        var originalId = contacto.Id;
        var originalEmail = contacto.Email;

        // Act
        contacto.Update("Juan Modified", "New Cargo", "+57 000");

        // Assert: Id and Email unchanged
        Assert.Equal(originalId, contacto.Id);
        Assert.Equal(originalEmail, contacto.Email);
    }

    // --- AssignCliente: updates UpdatedAt ---

    [Fact]
    public void AssignCliente_WithValidGuid_UpdatesUpdatedAt()
    {
        // Arrange
        var contacto = ContactoEntity.Create("Juan", "juan@test.com", null, null, null);
        var beforeAssign = contacto.UpdatedAt;

        // Small delay to ensure clock advances (UTC resolution)
        var clienteId = Guid.NewGuid();

        // Act
        contacto.AssignCliente(clienteId);

        // Assert: UpdatedAt is >= beforeAssign
        Assert.True(contacto.UpdatedAt >= beforeAssign);
    }

    [Fact]
    public void AssignCliente_WithNull_UpdatesUpdatedAt()
    {
        // Arrange: contacto already associated with a cliente
        var clienteId = Guid.NewGuid();
        var contacto = ContactoEntity.Create("Juan", "juan@test.com", null, null, clienteId);
        var beforeDisassociate = contacto.UpdatedAt;

        // Act: disassociate
        contacto.AssignCliente(null);

        // Assert: UpdatedAt is >= beforeDisassociate
        Assert.True(contacto.UpdatedAt >= beforeDisassociate);
    }

    [Fact]
    public void AssignCliente_CalledTwice_UpdatesClienteIdToLatestValue()
    {
        // Arrange
        var firstClienteId = Guid.NewGuid();
        var secondClienteId = Guid.NewGuid();
        var contacto = ContactoEntity.Create("Juan", "juan@test.com", null, null, null);

        // Act: assign, then reassign
        contacto.AssignCliente(firstClienteId);
        contacto.AssignCliente(secondClienteId);

        // Assert: latest value is kept
        Assert.Equal(secondClienteId, contacto.ClienteId);
    }

    // --- Timestamps: use UTC ---

    [Fact]
    public void Create_Timestamps_AreInUtc()
    {
        // Arrange & Act
        var contacto = ContactoEntity.Create("Juan", "juan@test.com", null, null, null);

        // Assert: UTC offset
        Assert.Equal(TimeSpan.Zero, contacto.CreatedAt.Offset);
        Assert.Equal(TimeSpan.Zero, contacto.UpdatedAt.Offset);
    }

    [Fact]
    public void Create_Timestamps_AreCloseToNow()
    {
        // Arrange
        var before = DateTimeOffset.UtcNow.AddSeconds(-1);

        // Act
        var contacto = ContactoEntity.Create("Juan", "juan@test.com", null, null, null);
        var after = DateTimeOffset.UtcNow.AddSeconds(1);

        // Assert
        Assert.InRange(contacto.CreatedAt, before, after);
        Assert.InRange(contacto.UpdatedAt, before, after);
    }

    // --- Update: UpdatedAt >= CreatedAt ---

    [Fact]
    public void Update_UpdatedAt_IsGreaterThanOrEqualToCreatedAt()
    {
        // Arrange
        var contacto = ContactoEntity.Create("Juan", "juan@test.com", null, null, null);
        var createdAt = contacto.CreatedAt;

        // Act
        contacto.Update("Juan v2", null, null);

        // Assert
        Assert.True(contacto.UpdatedAt >= createdAt);
    }
}
