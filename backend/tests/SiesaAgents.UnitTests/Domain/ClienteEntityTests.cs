using SiesaAgents.Domain.Clientes.Entities;
using Xunit;

namespace SiesaAgents.UnitTests.Domain;

public class ClienteEntityTests
{
    [Fact]
    public void Create_WithValidArgs_ReturnsEntityWithCorrectProperties()
    {
        // Arrange
        var nombre = "Empresa ABC";
        var nit = "900123456-1";
        var telefono = "3001234567";
        var ciudad = "Bogotá";

        // Act
        var entity = ClienteEntity.Create(nombre, nit, telefono, ciudad);

        // Assert
        Assert.NotEqual(Guid.Empty, entity.Id);
        Assert.Equal(nombre, entity.Nombre);
        Assert.Equal(nit, entity.Nit);
        Assert.Equal(telefono, entity.Telefono);
        Assert.Equal(ciudad, entity.Ciudad);
        Assert.NotEqual(default, entity.CreatedAt);
        Assert.True(entity.CreatedAt > DateTimeOffset.MinValue);
    }

    [Fact]
    public void Create_WithEmptyNombre_ThrowsDomainException()
    {
        // Arrange / Act / Assert
        var ex = Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create(string.Empty, "900123456-1", "3001234567", "Bogotá"));

        Assert.Equal("nombre", ex.ParamName);
    }

    [Fact]
    public void Create_WithWhitespaceNombre_ThrowsDomainException()
    {
        // Arrange / Act / Assert
        Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create("   ", "900123456-1", "3001234567", "Bogotá"));
    }

    [Fact]
    public void Create_WithEmptyNit_ThrowsDomainException()
    {
        // Arrange / Act / Assert
        var ex = Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create("Empresa ABC", string.Empty, "3001234567", "Bogotá"));

        Assert.Equal("nit", ex.ParamName);
    }

    [Fact]
    public void Create_WithWhitespaceNit_ThrowsDomainException()
    {
        // Arrange / Act / Assert
        Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create("Empresa ABC", "   ", "3001234567", "Bogotá"));
    }

    [Fact]
    public void Create_TwoEntities_HaveDifferentIds()
    {
        // Arrange / Act
        var e1 = ClienteEntity.Create("Empresa A", "900111111-1", "3001111111", "Medellín");
        var e2 = ClienteEntity.Create("Empresa B", "900222222-2", "3002222222", "Cali");

        // Assert
        Assert.NotEqual(e1.Id, e2.Id);
    }

    [Fact]
    public void Create_CreatedAtIsDateTimeOffset()
    {
        // Act
        var entity = ClienteEntity.Create("Empresa X", "900333333-3", "3003333333", "Bogotá");

        // Assert — verify it's a valid DateTimeOffset (not default)
        Assert.IsType<DateTimeOffset>(entity.CreatedAt);
        Assert.NotEqual(default(DateTimeOffset), entity.CreatedAt);
    }
}
