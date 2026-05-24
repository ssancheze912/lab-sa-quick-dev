using SiesaAgents.Domain.Contactos.Entities;

namespace SiesaAgents.UnitTests.Domain;

public class ContactoEntityTests
{
    [Fact]
    public void Create_WithValidData_ReturnsContactoEntityWithUuidId()
    {
        // Arrange
        var nombre = "Juan Pérez";
        var email = "juan@empresa.com";

        // Act
        var contacto = ContactoEntity.Create(nombre, email, null, null, null);

        // Assert
        Assert.NotEqual(Guid.Empty, contacto.Id);
        Assert.Equal(nombre, contacto.Nombre);
        Assert.Equal(email, contacto.Email);
        Assert.Null(contacto.ClienteId);
    }

    [Fact]
    public void Create_UsesDateTimeOffset_NotDateTime()
    {
        // Act
        var contacto = ContactoEntity.Create("Test", "test@test.com", null, null, null);

        // Assert - DateTimeOffset must be used (compile-time check)
        Assert.IsType<DateTimeOffset>(contacto.CreatedAt);
        Assert.IsType<DateTimeOffset>(contacto.UpdatedAt);
    }

    [Fact]
    public void AssignCliente_SetsClienteId()
    {
        // Arrange
        var contacto = ContactoEntity.Create("Juan", "juan@test.com", null, null, null);
        var clienteId = Guid.NewGuid();

        // Act
        contacto.AssignCliente(clienteId);

        // Assert
        Assert.Equal(clienteId, contacto.ClienteId);
    }

    [Fact]
    public void AssignCliente_WithNull_DisassociatesCliente()
    {
        // Arrange
        var clienteId = Guid.NewGuid();
        var contacto = ContactoEntity.Create("Juan", "juan@test.com", null, null, clienteId);

        // Act
        contacto.AssignCliente(null);

        // Assert
        Assert.Null(contacto.ClienteId);
    }
}
