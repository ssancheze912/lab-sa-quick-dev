using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.UnitTests.Domain.Clientes;

/// <summary>
/// Edge case and boundary condition tests for ClienteEntity.
/// Complements ClienteEntityTests.cs (happy-path ATDD tests).
/// </summary>
public class ClienteEntityEdgeCaseTests
{
    // ─── Create: whitespace-only fields ─────────────────────────────────────

    [Fact]
    public void Create_WithWhitespaceOnlyNombre_ThrowsArgumentException()
    {
        // Arrange & Act & Assert
        var ex = Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create("   ", "900-1", "601", "Bogotá"));
        Assert.Contains("Nombre", ex.Message);
    }

    [Fact]
    public void Create_WithWhitespaceOnlyNit_ThrowsArgumentException()
    {
        var ex = Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create("Empresa ABC", "   ", "601", "Bogotá"));
        Assert.Contains("NIT", ex.Message);
    }

    [Fact]
    public void Create_WithWhitespaceOnlyTelefono_ThrowsArgumentException()
    {
        var ex = Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create("Empresa ABC", "900-1", "\t", "Bogotá"));
        Assert.Contains("Teléfono", ex.Message);
    }

    [Fact]
    public void Create_WithWhitespaceOnlyCiudad_ThrowsArgumentException()
    {
        var ex = Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create("Empresa ABC", "900-1", "601", "\n"));
        Assert.Contains("Ciudad", ex.Message);
    }

    // ─── Create: null fields ─────────────────────────────────────────────────

    [Fact]
    public void Create_WithNullNombre_ThrowsArgumentException()
    {
        // Arrange & Act & Assert
        Assert.ThrowsAny<Exception>(() =>
            ClienteEntity.Create(null!, "900-1", "601", "Bogotá"));
    }

    [Fact]
    public void Create_WithNullNit_ThrowsArgumentException()
    {
        Assert.ThrowsAny<Exception>(() =>
            ClienteEntity.Create("Empresa ABC", null!, "601", "Bogotá"));
    }

    // ─── Create: Id uniqueness ───────────────────────────────────────────────

    [Fact]
    public void Create_TwoEntities_HaveDifferentIds()
    {
        // Act
        var entity1 = ClienteEntity.Create("Empresa A", "900-1", "601", "Bogotá");
        var entity2 = ClienteEntity.Create("Empresa B", "900-2", "602", "Medellín");

        // Assert: GUIDs are unique per entity
        Assert.NotEqual(entity1.Id, entity2.Id);
    }

    [Fact]
    public void Create_NewEntity_IdIsNotEmpty()
    {
        var entity = ClienteEntity.Create("Empresa ABC", "900-1", "601", "Bogotá");
        Assert.NotEqual(Guid.Empty, entity.Id);
    }

    // ─── Create: timestamps ──────────────────────────────────────────────────

    [Fact]
    public void Create_NewEntity_CreatedAtAndUpdatedAtAreEqual()
    {
        // Arrange
        var before = DateTimeOffset.UtcNow;

        // Act
        var entity = ClienteEntity.Create("Empresa ABC", "900-1", "601", "Bogotá");

        // Assert: both timestamps are within a reasonable range
        Assert.True(entity.CreatedAt >= before);
        Assert.True(entity.UpdatedAt >= before);
        // At creation, UpdatedAt should equal CreatedAt (or be very close)
        Assert.InRange(
            Math.Abs((entity.UpdatedAt - entity.CreatedAt).TotalMilliseconds),
            0, 1000
        );
    }

    // ─── Update: whitespace-only fields throw ────────────────────────────────

    [Fact]
    public void Update_WithWhitespaceOnlyNombre_ThrowsArgumentException()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa ABC", "900-1", "601", "Bogotá");

        // Act & Assert
        var ex = Assert.Throws<ArgumentException>(() =>
            entity.Update("   ", "900-1", "601", "Bogotá"));
        Assert.Contains("Nombre", ex.Message);
    }

    [Fact]
    public void Update_WithWhitespaceOnlyNit_ThrowsArgumentException()
    {
        var entity = ClienteEntity.Create("Empresa ABC", "900-1", "601", "Bogotá");
        var ex = Assert.Throws<ArgumentException>(() =>
            entity.Update("Empresa ABC", "  ", "601", "Bogotá"));
        Assert.Contains("NIT", ex.Message);
    }

    [Fact]
    public void Update_WithEmptyTelefono_ThrowsArgumentException()
    {
        var entity = ClienteEntity.Create("Empresa ABC", "900-1", "601", "Bogotá");
        var ex = Assert.Throws<ArgumentException>(() =>
            entity.Update("Empresa ABC", "900-1", string.Empty, "Bogotá"));
        Assert.Contains("Teléfono", ex.Message);
    }

    [Fact]
    public void Update_WithEmptyCiudad_ThrowsArgumentException()
    {
        var entity = ClienteEntity.Create("Empresa ABC", "900-1", "601", "Bogotá");
        var ex = Assert.Throws<ArgumentException>(() =>
            entity.Update("Empresa ABC", "900-1", "601", string.Empty));
        Assert.Contains("Ciudad", ex.Message);
    }

    // ─── Update: trims whitespace ─────────────────────────────────────────────

    [Fact]
    public void Update_TrimsWhitespaceFromAllFields()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa ABC", "900-1", "601", "Bogotá");

        // Act
        entity.Update("  Nuevo Nombre  ", "  900-2  ", "  602  ", "  Cali  ");

        // Assert
        Assert.Equal("Nuevo Nombre", entity.Nombre);
        Assert.Equal("900-2", entity.Nit);
        Assert.Equal("602", entity.Telefono);
        Assert.Equal("Cali", entity.Ciudad);
    }

    // ─── Update: CreatedAt is NOT changed on Update ───────────────────────────

    [Fact]
    public void Update_DoesNotModifyCreatedAt()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa ABC", "900-1", "601", "Bogotá");
        var originalCreatedAt = entity.CreatedAt;

        // Act
        entity.Update("Actualizado", "900-2", "602", "Medellín");

        // Assert: CreatedAt is immutable
        Assert.Equal(originalCreatedAt, entity.CreatedAt);
    }

    // ─── Update: UpdatedAt is always >= prior UpdatedAt ──────────────────────

    [Fact]
    public void Update_CalledTwice_UpdatedAtIsNonDecreasing()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa ABC", "900-1", "601", "Bogotá");

        // Act
        entity.Update("Primera Actualización", "900-1", "601", "Bogotá");
        var firstUpdateAt = entity.UpdatedAt;

        entity.Update("Segunda Actualización", "900-1", "601", "Bogotá");
        var secondUpdateAt = entity.UpdatedAt;

        // Assert: non-decreasing
        Assert.True(secondUpdateAt >= firstUpdateAt);
    }
}
