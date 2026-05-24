using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.UnitTests.Domain.Clientes;

public class ClienteEntityTests
{
    [Fact]
    public void Create_SetsAllFields_Correctly()
    {
        // Arrange
        const string nombre = "Empresa Ejemplo S.A.";
        const string nit = "900100200-1";
        const string telefono = "3001234567";
        const string ciudad = "Bogotá";

        // Act
        var cliente = ClienteEntity.Create(nombre, nit, telefono, ciudad);

        // Assert
        Assert.Equal(nombre, cliente.Nombre);
        Assert.Equal(nit, cliente.NIT);
        Assert.Equal(telefono, cliente.Telefono);
        Assert.Equal(ciudad, cliente.Ciudad);
    }

    [Fact]
    public void Create_SetsId_AsNonEmptyGuid()
    {
        // Arrange / Act
        var cliente = ClienteEntity.Create("Empresa", "123-456", "300000000", "Medellín");

        // Assert
        Assert.NotEqual(Guid.Empty, cliente.Id);
    }

    [Fact]
    public void Create_SetsCreatedAt_AsDateTimeOffset()
    {
        // Arrange
        var before = DateTimeOffset.UtcNow;

        // Act
        var cliente = ClienteEntity.Create("Empresa", "123-456", "300000000", "Cali");
        var after = DateTimeOffset.UtcNow;

        // Assert
        Assert.IsType<DateTimeOffset>(cliente.CreatedAt);
        Assert.True(cliente.CreatedAt >= before && cliente.CreatedAt <= after);
    }

    [Fact]
    public void Create_SetsUpdatedAt_AsDateTimeOffset()
    {
        // Arrange
        var before = DateTimeOffset.UtcNow;

        // Act
        var cliente = ClienteEntity.Create("Empresa", "999-000", "310000000", "Barranquilla");
        var after = DateTimeOffset.UtcNow;

        // Assert
        Assert.IsType<DateTimeOffset>(cliente.UpdatedAt);
        Assert.True(cliente.UpdatedAt >= before && cliente.UpdatedAt <= after);
    }
}
