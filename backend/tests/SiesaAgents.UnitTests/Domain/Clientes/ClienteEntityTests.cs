using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.UnitTests.Domain.Clientes;

public class ClienteEntityTests
{
    [Fact]
    public void Create_WithValidParams_SetsAllProperties()
    {
        // Arrange
        var nombre = "Empresa ABC";
        var nit = "900123456-7";
        var telefono = "601 234 5678";
        var ciudad = "Bogotá";

        // Act
        var entity = ClienteEntity.Create(nombre, nit, telefono, ciudad);

        // Assert
        Assert.NotEqual(Guid.Empty, entity.Id);
        Assert.Equal(nombre, entity.Nombre);
        Assert.Equal(nit, entity.Nit);
        Assert.Equal(telefono, entity.Telefono);
        Assert.Equal(ciudad, entity.Ciudad);
        Assert.True(entity.CreatedAt <= DateTimeOffset.UtcNow);
        Assert.True(entity.UpdatedAt <= DateTimeOffset.UtcNow);
    }

    [Fact]
    public void Create_WithEmptyNombre_ThrowsArgumentException()
    {
        // Act & Assert
        var ex = Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create(string.Empty, "900-1", "601", "Bogotá"));
        Assert.Contains("Nombre", ex.Message);
    }

    [Fact]
    public void Create_WithEmptyNit_ThrowsArgumentException()
    {
        // Act & Assert
        var ex = Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create("Empresa ABC", string.Empty, "601", "Bogotá"));
        Assert.Contains("NIT", ex.Message);
    }

    [Fact]
    public void Create_WithEmptyTelefono_ThrowsArgumentException()
    {
        // Act & Assert
        var ex = Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create("Empresa ABC", "900-1", string.Empty, "Bogotá"));
        Assert.Contains("Teléfono", ex.Message);
    }

    [Fact]
    public void Create_WithEmptyCiudad_ThrowsArgumentException()
    {
        // Act & Assert
        var ex = Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create("Empresa ABC", "900-1", "601", string.Empty));
        Assert.Contains("Ciudad", ex.Message);
    }

    [Fact]
    public void Update_ChangesFieldsAndUpdatesTimestamp()
    {
        // Arrange
        var entity = ClienteEntity.Create("Original", "900-1", "601", "Bogotá");
        var originalUpdatedAt = entity.UpdatedAt;

        // Act
        entity.Update("Actualizado", "900-2", "602", "Medellín");

        // Assert
        Assert.Equal("Actualizado", entity.Nombre);
        Assert.Equal("900-2", entity.Nit);
        Assert.Equal("602", entity.Telefono);
        Assert.Equal("Medellín", entity.Ciudad);
        Assert.True(entity.UpdatedAt >= originalUpdatedAt);
    }

    [Fact]
    public void Create_TrimsWhitespace()
    {
        // Arrange & Act
        var entity = ClienteEntity.Create("  Empresa ABC  ", "  900-1  ", "  601  ", "  Bogotá  ");

        // Assert
        Assert.Equal("Empresa ABC", entity.Nombre);
        Assert.Equal("900-1", entity.Nit);
        Assert.Equal("601", entity.Telefono);
        Assert.Equal("Bogotá", entity.Ciudad);
    }
}
