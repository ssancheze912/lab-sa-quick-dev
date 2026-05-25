using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.UnitTests.Domain;

/// <summary>
/// Edge cases and boundary conditions for ClienteEntity not covered by ClienteEntityTests.
/// </summary>
public class ClienteEntityEdgeCaseTests
{
    // --- Create: boundary conditions on required fields ---

    [Fact]
    public void Create_WithWhitespaceOnlyNombre_ThrowsArgumentException()
    {
        // Arrange: whitespace-only nombre
        // Act & Assert
        Assert.Throws<ArgumentException>(() => ClienteEntity.Create("   ", "900-1", null, null));
    }

    [Fact]
    public void Create_WithNullNombre_ThrowsArgumentException()
    {
        // Arrange: null nombre
        // Act & Assert
        Assert.Throws<ArgumentException>(() => ClienteEntity.Create(null!, "900-1", null, null));
    }

    [Fact]
    public void Create_WithEmptyNit_ThrowsArgumentException()
    {
        // Arrange: empty nit
        // Act & Assert
        Assert.Throws<ArgumentException>(() => ClienteEntity.Create("Empresa A", "", null, null));
    }

    [Fact]
    public void Create_WithWhitespaceOnlyNit_ThrowsArgumentException()
    {
        // Arrange: whitespace-only nit
        // Act & Assert
        Assert.Throws<ArgumentException>(() => ClienteEntity.Create("Empresa A", "  ", null, null));
    }

    [Fact]
    public void Create_WithNullNit_ThrowsArgumentException()
    {
        // Arrange: null nit
        // Act & Assert
        Assert.Throws<ArgumentException>(() => ClienteEntity.Create("Empresa A", null!, null, null));
    }

    // --- Create: optional fields ---

    [Fact]
    public void Create_WithAllOptionalFields_MapsThemCorrectly()
    {
        // Arrange
        var telefono = "+57 601 1234567";
        var ciudad = "Bogotá";

        // Act
        var cliente = ClienteEntity.Create("Empresa XYZ", "800100200-1", telefono, ciudad);

        // Assert
        Assert.Equal(telefono, cliente.Telefono);
        Assert.Equal(ciudad, cliente.Ciudad);
    }

    [Fact]
    public void Create_WithNullOptionalFields_StoresNulls()
    {
        // Arrange: all optional fields null
        // Act
        var cliente = ClienteEntity.Create("Empresa A", "123-4", null, null);

        // Assert
        Assert.Null(cliente.Telefono);
        Assert.Null(cliente.Ciudad);
    }

    // --- Create: each call produces a unique Id (no collisions) ---

    [Fact]
    public void Create_TwiceWithSameData_ProducesDistinctIds()
    {
        // Arrange & Act
        var cliente1 = ClienteEntity.Create("Empresa A", "111-1", null, null);
        var cliente2 = ClienteEntity.Create("Empresa A", "111-1", null, null);

        // Assert: Guid uniqueness per creation
        Assert.NotEqual(cliente1.Id, cliente2.Id);
    }

    // --- Update: boundary conditions ---

    [Fact]
    public void Update_WithEmptyNombre_ThrowsArgumentException()
    {
        // Arrange
        var cliente = ClienteEntity.Create("Empresa Inicial", "900-1", null, null);

        // Act & Assert
        Assert.Throws<ArgumentException>(() => cliente.Update("", null, null));
    }

    [Fact]
    public void Update_WithWhitespaceOnlyNombre_ThrowsArgumentException()
    {
        // Arrange
        var cliente = ClienteEntity.Create("Empresa Inicial", "900-1", null, null);

        // Act & Assert
        Assert.Throws<ArgumentException>(() => cliente.Update("   ", null, null));
    }

    [Fact]
    public void Update_WithNullNombre_ThrowsArgumentException()
    {
        // Arrange
        var cliente = ClienteEntity.Create("Empresa Inicial", "900-1", null, null);

        // Act & Assert
        Assert.Throws<ArgumentException>(() => cliente.Update(null!, null, null));
    }

    // --- Update: optional field clearing ---

    [Fact]
    public void Update_WithNullOptionalFields_ClearsTelefonoAndCiudad()
    {
        // Arrange: cliente created with optional fields populated
        var cliente = ClienteEntity.Create("Empresa A", "900-1", "+57 601 000", "Medellín");

        // Act: update clearing optionals
        cliente.Update("Empresa A Renamed", null, null);

        // Assert: optional fields cleared
        Assert.Null(cliente.Telefono);
        Assert.Null(cliente.Ciudad);
    }

    [Fact]
    public void Update_UpdatesTelefonoAndCiudad()
    {
        // Arrange
        var cliente = ClienteEntity.Create("Empresa A", "900-1", null, null);

        // Act
        cliente.Update("Empresa A", "+57 312 000 0000", "Cali");

        // Assert
        Assert.Equal("+57 312 000 0000", cliente.Telefono);
        Assert.Equal("Cali", cliente.Ciudad);
    }

    // --- Update: Id and Nit are immutable ---

    [Fact]
    public void Update_DoesNotChangeIdOrNit()
    {
        // Arrange
        var cliente = ClienteEntity.Create("Empresa A", "900-1", null, null);
        var originalId = cliente.Id;
        var originalNit = cliente.Nit;

        // Act
        cliente.Update("Empresa A Modified", "+57 000", "Bogotá");

        // Assert: Id and Nit unchanged
        Assert.Equal(originalId, cliente.Id);
        Assert.Equal(originalNit, cliente.Nit);
    }

    // --- Update: UpdatedAt is always >= CreatedAt after update ---

    [Fact]
    public void Update_UpdatedAt_IsGreaterThanOrEqualToCreatedAt()
    {
        // Arrange
        var cliente = ClienteEntity.Create("Empresa A", "900-1", null, null);
        var createdAt = cliente.CreatedAt;

        // Act
        cliente.Update("Empresa A v2", null, null);

        // Assert
        Assert.True(cliente.UpdatedAt >= createdAt);
    }

    // --- Timestamps: use UTC timezone ---

    [Fact]
    public void Create_Timestamps_AreInUtc()
    {
        // Arrange & Act
        var cliente = ClienteEntity.Create("Empresa A", "900-1", null, null);

        // Assert: DateTimeOffset offset is 0 (UTC)
        Assert.Equal(TimeSpan.Zero, cliente.CreatedAt.Offset);
        Assert.Equal(TimeSpan.Zero, cliente.UpdatedAt.Offset);
    }

    // --- CreatedAt and UpdatedAt are within expected range ---

    [Fact]
    public void Create_Timestamps_AreCloseToNow()
    {
        // Arrange
        var before = DateTimeOffset.UtcNow.AddSeconds(-1);

        // Act
        var cliente = ClienteEntity.Create("Empresa A", "900-1", null, null);
        var after = DateTimeOffset.UtcNow.AddSeconds(1);

        // Assert: timestamps are within a 2-second window of creation
        Assert.InRange(cliente.CreatedAt, before, after);
        Assert.InRange(cliente.UpdatedAt, before, after);
    }
}
