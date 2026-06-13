using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.UnitTests.Domain.Clientes;

/// <summary>
/// Unit tests for ClienteEntity domain model.
/// Covers: Create() factory validation, property assignment, and boundary conditions.
/// Pattern: Arrange / Act / Assert (xUnit)
/// </summary>
public class ClienteEntityTests
{
    // -------------------------------------------------------------------------
    // ClienteEntity.Create() — happy path
    // -------------------------------------------------------------------------

    [Fact]
    public void Create_ValidArguments_ReturnsEntityWithCorrectProperties()
    {
        // Arrange
        const string nombre = "Empresa Alfa SA";
        const string nit = "900100200";
        const string telefono = "3001000001";
        const string ciudad = "Bogotá";

        // Act
        var entity = ClienteEntity.Create(nombre, nit, telefono, ciudad);

        // Assert
        Assert.Equal(nombre, entity.Nombre);
        Assert.Equal(nit, entity.Nit);
        Assert.Equal(telefono, entity.Telefono);
        Assert.Equal(ciudad, entity.Ciudad);
    }

    [Fact]
    public void Create_ValidArguments_AssignsNewGuidId()
    {
        // Arrange / Act
        var entity = ClienteEntity.Create("Empresa", "123456789", "3000000000", "Cali");

        // Assert
        Assert.NotEqual(Guid.Empty, entity.Id);
    }

    [Fact]
    public void Create_CalledTwice_AssignsDifferentIds()
    {
        // Arrange / Act
        var entity1 = ClienteEntity.Create("Empresa Uno", "111111111", "3000000001", "Bogotá");
        var entity2 = ClienteEntity.Create("Empresa Dos", "222222222", "3000000002", "Medellín");

        // Assert
        Assert.NotEqual(entity1.Id, entity2.Id);
    }

    [Fact]
    public void Create_ValidArguments_SetsCreatedAtToUtcNow()
    {
        // Arrange
        var before = DateTimeOffset.UtcNow.AddSeconds(-1);

        // Act
        var entity = ClienteEntity.Create("Empresa", "123456789", "3000000000", "Cali");

        var after = DateTimeOffset.UtcNow.AddSeconds(1);

        // Assert
        Assert.True(entity.CreatedAt >= before, $"CreatedAt {entity.CreatedAt} should be >= {before}");
        Assert.True(entity.CreatedAt <= after, $"CreatedAt {entity.CreatedAt} should be <= {after}");
    }

    [Fact]
    public void Create_ValidArguments_SetsUpdatedAtToUtcNow()
    {
        // Arrange
        var before = DateTimeOffset.UtcNow.AddSeconds(-1);

        // Act
        var entity = ClienteEntity.Create("Empresa", "123456789", "3000000000", "Cali");

        var after = DateTimeOffset.UtcNow.AddSeconds(1);

        // Assert
        Assert.True(entity.UpdatedAt >= before, $"UpdatedAt {entity.UpdatedAt} should be >= {before}");
        Assert.True(entity.UpdatedAt <= after, $"UpdatedAt {entity.UpdatedAt} should be <= {after}");
    }

    [Fact]
    public void Create_WithEmptyTelefono_CreatesEntitySuccessfully()
    {
        // Arrange / Act: Telefono is NOT validated by ArgumentException.ThrowIfNullOrWhiteSpace
        var entity = ClienteEntity.Create("Empresa Ejemplo", "900000001", string.Empty, "Bogotá");

        // Assert
        Assert.Equal(string.Empty, entity.Telefono);
    }

    [Fact]
    public void Create_WithEmptyCiudad_CreatesEntitySuccessfully()
    {
        // Arrange / Act: Ciudad is NOT validated — it is optional
        var entity = ClienteEntity.Create("Empresa Ejemplo", "900000002", "3000000000", string.Empty);

        // Assert
        Assert.Equal(string.Empty, entity.Ciudad);
    }

    // -------------------------------------------------------------------------
    // ClienteEntity.Create() — validation: nombre
    // -------------------------------------------------------------------------

    [Fact]
    public void Create_NullNombre_ThrowsArgumentException()
    {
        // Arrange / Act / Assert
        Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create(null!, "900100200", "3001000001", "Bogotá"));
    }

    [Fact]
    public void Create_EmptyNombre_ThrowsArgumentException()
    {
        // Arrange / Act / Assert
        Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create(string.Empty, "900100200", "3001000001", "Bogotá"));
    }

    [Theory]
    [InlineData(" ")]
    [InlineData("   ")]
    [InlineData("\t")]
    [InlineData("\n")]
    public void Create_WhitespaceOnlyNombre_ThrowsArgumentException(string whitespace)
    {
        // Arrange / Act / Assert
        Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create(whitespace, "900100200", "3001000001", "Bogotá"));
    }

    // -------------------------------------------------------------------------
    // ClienteEntity.Create() — validation: nit
    // -------------------------------------------------------------------------

    [Fact]
    public void Create_NullNit_ThrowsArgumentException()
    {
        // Arrange / Act / Assert
        Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create("Empresa Válida", null!, "3001000001", "Bogotá"));
    }

    [Fact]
    public void Create_EmptyNit_ThrowsArgumentException()
    {
        // Arrange / Act / Assert
        Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create("Empresa Válida", string.Empty, "3001000001", "Bogotá"));
    }

    [Theory]
    [InlineData(" ")]
    [InlineData("   ")]
    [InlineData("\t")]
    public void Create_WhitespaceOnlyNit_ThrowsArgumentException(string whitespace)
    {
        // Arrange / Act / Assert
        Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create("Empresa Válida", whitespace, "3001000001", "Bogotá"));
    }

    // -------------------------------------------------------------------------
    // ClienteEntity — property type invariants
    // -------------------------------------------------------------------------

    [Fact]
    public void Create_ValidArguments_IdIsGuidType()
    {
        // Arrange / Act
        var entity = ClienteEntity.Create("Empresa", "900000003", "3000000003", "Cali");

        // Assert: Id must be a Guid (UUID PK per company standards)
        Assert.IsType<Guid>(entity.Id);
    }

    [Fact]
    public void Create_ValidArguments_CreatedAtIsDateTimeOffset()
    {
        // Arrange / Act
        var entity = ClienteEntity.Create("Empresa", "900000004", "3000000004", "Barranquilla");

        // Assert: DateTimeOffset — NEVER DateTime per company standards
        Assert.IsType<DateTimeOffset>(entity.CreatedAt);
    }

    [Fact]
    public void Create_ValidArguments_UpdatedAtIsDateTimeOffset()
    {
        // Arrange / Act
        var entity = ClienteEntity.Create("Empresa", "900000005", "3000000005", "Barranquilla");

        // Assert: DateTimeOffset — NEVER DateTime per company standards
        Assert.IsType<DateTimeOffset>(entity.UpdatedAt);
    }
}
