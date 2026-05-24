using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.UnitTests.Domain;

public class ClienteEntityTests
{
    [Fact]
    public void Create_WithValidData_ReturnsClienteEntityWithUuidId()
    {
        // Arrange
        var nombre = "Empresa ABC";
        var nit = "900123456-1";

        // Act
        var cliente = ClienteEntity.Create(nombre, nit, null, null);

        // Assert
        Assert.NotEqual(Guid.Empty, cliente.Id);
        Assert.Equal(nombre, cliente.Nombre);
        Assert.Equal(nit, cliente.Nit);
    }

    [Fact]
    public void Create_UsesDateTimeOffset_NotDateTime()
    {
        // Act
        var cliente = ClienteEntity.Create("Test", "123-4", null, null);

        // Assert - DateTimeOffset must be used (compile-time check)
        Assert.IsType<DateTimeOffset>(cliente.CreatedAt);
        Assert.IsType<DateTimeOffset>(cliente.UpdatedAt);
    }

    [Fact]
    public void Create_WithEmptyNombre_ThrowsArgumentException()
    {
        // Act & Assert
        Assert.Throws<ArgumentException>(() => ClienteEntity.Create("", "123-4", null, null));
    }

    [Fact]
    public void Update_UpdatesNombreAndUpdatedAt()
    {
        // Arrange
        var cliente = ClienteEntity.Create("Empresa Inicial", "900-1", null, null);
        var updatedAt = cliente.UpdatedAt;

        // Act
        cliente.Update("Empresa Modificada", null, null);

        // Assert
        Assert.Equal("Empresa Modificada", cliente.Nombre);
        Assert.True(cliente.UpdatedAt >= updatedAt);
    }
}
