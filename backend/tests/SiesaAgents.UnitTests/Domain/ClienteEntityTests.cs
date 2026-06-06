/**
 * Story 2.1: Client List & Search
 * Unit tests for ClienteEntity domain class
 *
 * Acceptance Criteria covered: AC1 — domain entity creation with correct field values,
 *                              non-empty Guid Id, DateTimeOffset timestamps
 *
 * NOTE: Tests are in RED state — they will fail until ClienteEntity.cs is implemented
 *       at: backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs
 */

using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.UnitTests.Domain;

public class ClienteEntityTests
{
    // ─── Given/When/Then: Create factory ─────────────────────────────────────

    /// <summary>
    /// Given: Valid Nombre, Nit, Telefono and Ciudad values
    /// When: ClienteEntity.Create() is called
    /// Then: All fields are set correctly on the returned entity
    /// AC1 — entity creation
    /// </summary>
    [Fact]
    public void Create_SetsAllFieldsCorrectly()
    {
        // Arrange
        const string nombre = "Constructora Andina S.A.S";
        const string nit = "900123456-1";
        const string telefono = "3001234567";
        const string ciudad = "Bogotá";

        // Act
        var entity = ClienteEntity.Create(nombre, nit, telefono, ciudad);

        // Assert
        Assert.Equal(nombre, entity.Nombre);
        Assert.Equal(nit, entity.Nit);
        Assert.Equal(telefono, entity.Telefono);
        Assert.Equal(ciudad, entity.Ciudad);
    }

    /// <summary>
    /// Given: ClienteEntity.Create() is called
    /// When: The entity is instantiated
    /// Then: Id is a non-empty Guid (auto-generated)
    /// AC1 — entity Id uniqueness
    /// </summary>
    [Fact]
    public void Create_IdIsNonEmptyGuid()
    {
        // Act
        var entity = ClienteEntity.Create("Test", "123456789-0", "3000000000", "Cali");

        // Assert
        Assert.NotEqual(Guid.Empty, entity.Id);
    }

    /// <summary>
    /// Given: Two separate calls to ClienteEntity.Create()
    /// When: Each entity is instantiated
    /// Then: Their Ids are different (uniqueness guarantee)
    /// </summary>
    [Fact]
    public void Create_TwoEntities_HaveDifferentIds()
    {
        // Act
        var entity1 = ClienteEntity.Create("Empresa A", "111111111-1", "3001111111", "Bogotá");
        var entity2 = ClienteEntity.Create("Empresa B", "222222222-2", "3002222222", "Medellín");

        // Assert
        Assert.NotEqual(entity1.Id, entity2.Id);
    }

    // ─── Given/When/Then: DateTimeOffset timestamps ───────────────────────────

    /// <summary>
    /// Given: ClienteEntity.Create() is called
    /// When: The entity is instantiated
    /// Then: CreatedAt and UpdatedAt are of type DateTimeOffset (not DateTime)
    ///       — company standard: NEVER use DateTime, always use DateTimeOffset
    /// AC1 — timestamp type enforcement
    /// </summary>
    [Fact]
    public void Create_CreatedAtAndUpdatedAt_AreDateTimeOffset()
    {
        // Act
        var entity = ClienteEntity.Create("Test", "999888777-1", "3009998887", "Barranquilla");

        // Assert — DateTimeOffset is a value type, so just verify it has a value
        Assert.IsType<DateTimeOffset>(entity.CreatedAt);
        Assert.IsType<DateTimeOffset>(entity.UpdatedAt);
    }

    /// <summary>
    /// Given: ClienteEntity.Create() is called
    /// When: The entity is instantiated
    /// Then: CreatedAt and UpdatedAt are set to approximately UtcNow
    /// </summary>
    [Fact]
    public void Create_CreatedAt_IsSetToApproximatelyUtcNow()
    {
        // Arrange
        var before = DateTimeOffset.UtcNow;

        // Act
        var entity = ClienteEntity.Create("Test", "123456789-1", "3000000000", "Bogotá");

        // Assert
        var after = DateTimeOffset.UtcNow;
        Assert.True(entity.CreatedAt >= before && entity.CreatedAt <= after,
            $"CreatedAt {entity.CreatedAt} should be between {before} and {after}");
    }

    /// <summary>
    /// Given: ClienteEntity.Create() is called
    /// When: The entity is instantiated
    /// Then: UpdatedAt is set to approximately UtcNow
    /// </summary>
    [Fact]
    public void Create_UpdatedAt_IsSetToApproximatelyUtcNow()
    {
        // Arrange
        var before = DateTimeOffset.UtcNow;

        // Act
        var entity = ClienteEntity.Create("Test", "987654321-1", "3009876543", "Cali");

        // Assert
        var after = DateTimeOffset.UtcNow;
        Assert.True(entity.UpdatedAt >= before && entity.UpdatedAt <= after,
            $"UpdatedAt {entity.UpdatedAt} should be between {before} and {after}");
    }

    /// <summary>
    /// Given: ClienteEntity.Create() is called
    /// When: The entity is instantiated
    /// Then: CreatedAt uses UTC timezone (Offset == TimeSpan.Zero)
    ///       — company standard: DateTimeOffset should always be UTC
    /// </summary>
    [Fact]
    public void Create_CreatedAt_IsUtc()
    {
        // Act
        var entity = ClienteEntity.Create("Test UTC", "555666777-1", "3005556667", "Bogotá");

        // Assert — UTC offset must be zero
        Assert.Equal(TimeSpan.Zero, entity.CreatedAt.Offset);
    }

    // ─── Given/When/Then: Private constructor enforcement ────────────────────

    /// <summary>
    /// Given: The Create factory is the only way to instantiate ClienteEntity
    /// When: A valid entity is created
    /// Then: It is a non-null instance of ClienteEntity
    /// </summary>
    [Fact]
    public void Create_ReturnsNonNullClienteEntity()
    {
        // Act
        var entity = ClienteEntity.Create("Test", "111222333-1", "3001112223", "Bogotá");

        // Assert
        Assert.NotNull(entity);
    }

    /// <summary>
    /// Validates that all string fields are stored exactly as provided
    /// (no trimming or transformation by the domain — that is the application layer's job).
    /// </summary>
    [Theory]
    [InlineData("Empresa Con Espacios", "100200300-0", "3001002003", "Ciudad Específica")]
    [InlineData("EMPRESA MAYUSCULAS", "400500600-0", "3004005006", "CIUDAD")]
    [InlineData("empresa minúsculas", "700800900-0", "3007008009", "ciudad")]
    public void Create_PreservesFieldValuesExactly(
        string nombre, string nit, string telefono, string ciudad)
    {
        // Act
        var entity = ClienteEntity.Create(nombre, nit, telefono, ciudad);

        // Assert
        Assert.Equal(nombre, entity.Nombre);
        Assert.Equal(nit, entity.Nit);
        Assert.Equal(telefono, entity.Telefono);
        Assert.Equal(ciudad, entity.Ciudad);
    }
}
