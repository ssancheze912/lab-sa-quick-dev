using SiesaAgents.Domain.Clientes.Entities;
using Xunit;

namespace SiesaAgents.UnitTests.Domain;

public class ClienteEntityTests
{
    [Fact]
    public void Create_SetsIdAsNewGuid()
    {
        // Arrange & Act
        var cliente = ClienteEntity.Create("Empresa ABC", "900123456-1", "+573001234567", "Bogotá");

        // Assert
        Assert.NotEqual(Guid.Empty, cliente.Id);
    }

    [Fact]
    public void Create_SetCreatedAtAsDateTimeOffset()
    {
        // Arrange & Act
        var before = DateTimeOffset.UtcNow.AddSeconds(-1);
        var cliente = ClienteEntity.Create("Empresa ABC", "900123456-1", "+573001234567", "Bogotá");
        var after = DateTimeOffset.UtcNow.AddSeconds(1);

        // Assert — verifies CreatedAt is DateTimeOffset (not DateTime)
        Assert.IsType<DateTimeOffset>(cliente.CreatedAt);
        Assert.InRange(cliente.CreatedAt, before, after);
    }

    [Fact]
    public void Create_SetsAllProperties()
    {
        // Arrange & Act
        var cliente = ClienteEntity.Create("Empresa XYZ", "800111222-3", "6012345678", "Medellín");

        // Assert
        Assert.Equal("Empresa XYZ", cliente.Nombre);
        Assert.Equal("800111222-3", cliente.Nit);
        Assert.Equal("6012345678", cliente.Telefono);
        Assert.Equal("Medellín", cliente.Ciudad);
    }

    [Fact]
    public void Create_TwoEntities_HaveDifferentIds()
    {
        // Arrange & Act
        var c1 = ClienteEntity.Create("Empresa A", "900111111-1", "300", "Bogotá");
        var c2 = ClienteEntity.Create("Empresa B", "900222222-2", "301", "Cali");

        // Assert
        Assert.NotEqual(c1.Id, c2.Id);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WithEmptyNombre_ThrowsArgumentException(string? nombre)
    {
        // Arrange & Act & Assert
        Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create(nombre!, "900123456-1", "+57300", "Bogotá"));
    }
}
