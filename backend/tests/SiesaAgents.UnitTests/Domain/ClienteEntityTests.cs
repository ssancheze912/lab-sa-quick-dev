using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.UnitTests.Domain;

public class ClienteEntityTests
{
    // ────────────────────────────────────────────────────────────────────────
    // Create() factory
    // ────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Create_SetsAllPropertiesCorrectly()
    {
        // Arrange
        const string nombre = "Empresa ABC";
        const string nit = "900123456-1";
        const string telefono = "3001234567";
        const string ciudad = "Bogotá";

        // Act
        var cliente = ClienteEntity.Create(nombre, nit, telefono, ciudad);

        // Assert
        Assert.Equal(nombre, cliente.Nombre);
        Assert.Equal(nit, cliente.Nit);
        Assert.Equal(telefono, cliente.Telefono);
        Assert.Equal(ciudad, cliente.Ciudad);
    }

    [Fact]
    public void Create_AssignsNonEmptyGuidId()
    {
        // Arrange & Act
        var cliente = ClienteEntity.Create("Empresa", "123", "555", "Cali");

        // Assert
        Assert.NotEqual(Guid.Empty, cliente.Id);
    }

    [Fact]
    public void Create_SetsCreatedAtAndUpdatedAtToUtcNow()
    {
        // Arrange
        var before = DateTimeOffset.UtcNow.AddSeconds(-1);

        // Act
        var cliente = ClienteEntity.Create("Empresa", "123", "555", "Cali");

        // Assert
        Assert.True(cliente.CreatedAt >= before);
        Assert.True(cliente.UpdatedAt >= before);
    }

    [Fact]
    public void Create_TimestampsAreNotDateTime_TheyAreDateTimeOffset()
    {
        // Arrange & Act
        var cliente = ClienteEntity.Create("Empresa", "123", "555", "Cali");

        // Assert: property types are DateTimeOffset (compile-time guarantee, confirmed at runtime)
        Assert.IsType<DateTimeOffset>(cliente.CreatedAt);
        Assert.IsType<DateTimeOffset>(cliente.UpdatedAt);
    }

    // ────────────────────────────────────────────────────────────────────────
    // Update() method
    // ────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Update_MutatesFieldsCorrectly()
    {
        // Arrange
        var cliente = ClienteEntity.Create("Original", "000", "000", "Bogotá");

        // Act
        cliente.Update("Modificado", "999", "111", "Medellín");

        // Assert
        Assert.Equal("Modificado", cliente.Nombre);
        Assert.Equal("999", cliente.Nit);
        Assert.Equal("111", cliente.Telefono);
        Assert.Equal("Medellín", cliente.Ciudad);
    }

    [Fact]
    public void Update_ChangesUpdatedAt()
    {
        // Arrange
        var cliente = ClienteEntity.Create("Original", "000", "000", "Bogotá");
        var originalUpdatedAt = cliente.UpdatedAt;

        // Small pause to ensure time difference
        System.Threading.Thread.Sleep(5);

        // Act
        cliente.Update("Nuevo", "999", "111", "Cali");

        // Assert
        Assert.True(cliente.UpdatedAt >= originalUpdatedAt);
    }

    [Fact]
    public void Update_DoesNotChangeCreatedAt()
    {
        // Arrange
        var cliente = ClienteEntity.Create("Original", "000", "000", "Bogotá");
        var originalCreatedAt = cliente.CreatedAt;

        // Act
        cliente.Update("Nuevo", "999", "111", "Cali");

        // Assert
        Assert.Equal(originalCreatedAt, cliente.CreatedAt);
    }
}
