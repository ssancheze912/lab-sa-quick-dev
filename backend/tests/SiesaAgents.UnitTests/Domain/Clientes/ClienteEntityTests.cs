using SiesaAgents.Domain.Clientes.Entities;
using Xunit;

namespace SiesaAgents.UnitTests.Domain.Clientes;

/// <summary>
/// Story 2.1 — Client List &amp; Search
/// Unit Tests: ClienteEntity domain entity
///
/// RED Phase: All tests fail until ClienteEntity is implemented.
///
/// Verifies:
///   - Create factory method returns a valid entity with all fields set
///   - Id is a non-empty Guid (UUID)
///   - CreatedAt and UpdatedAt are DateTimeOffset (not DateTime)
///   - Validation: empty Nombre throws ArgumentException
///   - Validation: empty NitRuc throws ArgumentException
///   - Validation: empty Telefono throws ArgumentException
///   - Validation: empty Ciudad throws ArgumentException
///   - Whitespace-only values are treated as empty (ArgumentException)
/// </summary>
public class ClienteEntityTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Factory — Happy Path
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Create_ValidData_ReturnsEntityWithAllFieldsSet()
    {
        // GIVEN: Valid input data for a new client
        const string nombre = "Empresa Ejemplo";
        const string nitRuc = "900123456";
        const string telefono = "3001234567";
        const string ciudad = "Bogotá";

        // WHEN: ClienteEntity is created via factory method
        var entity = ClienteEntity.Create(nombre, nitRuc, telefono, ciudad);

        // THEN: All fields are set to the provided values
        Assert.Equal(nombre, entity.Nombre);
        Assert.Equal(nitRuc, entity.NitRuc);
        Assert.Equal(telefono, entity.Telefono);
        Assert.Equal(ciudad, entity.Ciudad);
    }

    [Fact]
    public void Create_ValidData_ReturnsEntityWithNonEmptyGuidId()
    {
        // GIVEN: Valid input data
        // WHEN: ClienteEntity is created
        var entity = ClienteEntity.Create("Empresa Test", "800000001", "3009999999", "Cali");

        // THEN: Id is a non-empty Guid (UUID — company standard: UUID PKs mandatory)
        Assert.NotEqual(Guid.Empty, entity.Id);
    }

    [Fact]
    public void Create_TwoClients_HaveDifferentIds()
    {
        // GIVEN: Two client creation calls with valid data
        // WHEN: Both entities are created
        var entity1 = ClienteEntity.Create("Empresa A", "900001001", "3001111111", "Bogotá");
        var entity2 = ClienteEntity.Create("Empresa B", "900001002", "3002222222", "Medellín");

        // THEN: Each entity has a unique Id
        Assert.NotEqual(entity1.Id, entity2.Id);
    }

    [Fact]
    public void Create_ValidData_ReturnsEntityWithCreatedAtAsDateTimeOffset()
    {
        // GIVEN: Valid input data
        var before = DateTimeOffset.UtcNow;

        // WHEN: ClienteEntity is created
        var entity = ClienteEntity.Create("Empresa Timestamp", "700000001", "3003333333", "Cali");

        var after = DateTimeOffset.UtcNow;

        // THEN: CreatedAt is a DateTimeOffset (never DateTime) within the expected range
        Assert.IsType<DateTimeOffset>(entity.CreatedAt);
        Assert.True(entity.CreatedAt >= before, "CreatedAt should be >= time before creation");
        Assert.True(entity.CreatedAt <= after, "CreatedAt should be <= time after creation");
    }

    [Fact]
    public void Create_ValidData_ReturnsEntityWithUpdatedAtAsDateTimeOffset()
    {
        // GIVEN: Valid input data
        var before = DateTimeOffset.UtcNow;

        // WHEN: ClienteEntity is created
        var entity = ClienteEntity.Create("Empresa Updated", "600000001", "3004444444", "Barranquilla");

        var after = DateTimeOffset.UtcNow;

        // THEN: UpdatedAt is a DateTimeOffset (company standard: always DateTimeOffset, never DateTime)
        Assert.IsType<DateTimeOffset>(entity.UpdatedAt);
        Assert.True(entity.UpdatedAt >= before);
        Assert.True(entity.UpdatedAt <= after);
    }

    [Fact]
    public void Create_ValidData_TrimsLeadingAndTrailingWhitespace()
    {
        // GIVEN: Input strings with leading/trailing whitespace
        // WHEN: ClienteEntity is created
        var entity = ClienteEntity.Create("  Empresa Trim  ", "  900999001  ", "  3005555555  ", "  Manizales  ");

        // THEN: Fields are trimmed
        Assert.Equal("Empresa Trim", entity.Nombre);
        Assert.Equal("900999001", entity.NitRuc);
        Assert.Equal("3005555555", entity.Telefono);
        Assert.Equal("Manizales", entity.Ciudad);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Factory — Validation: Required Fields
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Create_EmptyNombre_ThrowsArgumentException()
    {
        // GIVEN: Empty nombre (required field)
        // WHEN: ClienteEntity.Create is called with empty nombre
        // THEN: ArgumentException is thrown — form validation AC enforces all fields required
        var exception = Record.Exception(() =>
            ClienteEntity.Create(string.Empty, "900001001", "3001111111", "Bogotá"));

        Assert.NotNull(exception);
        Assert.IsType<ArgumentException>(exception);
    }

    [Fact]
    public void Create_EmptyNitRuc_ThrowsArgumentException()
    {
        // GIVEN: Empty NitRuc (unique business key — required)
        // WHEN: ClienteEntity.Create is called with empty nitRuc
        // THEN: ArgumentException is thrown
        var exception = Record.Exception(() =>
            ClienteEntity.Create("Empresa Válida", string.Empty, "3001111111", "Bogotá"));

        Assert.NotNull(exception);
        Assert.IsType<ArgumentException>(exception);
    }

    [Fact]
    public void Create_EmptyTelefono_ThrowsArgumentException()
    {
        // GIVEN: Empty telefono (required field per FR1)
        // WHEN: ClienteEntity.Create is called with empty telefono
        // THEN: ArgumentException is thrown
        var exception = Record.Exception(() =>
            ClienteEntity.Create("Empresa Válida", "900001001", string.Empty, "Bogotá"));

        Assert.NotNull(exception);
        Assert.IsType<ArgumentException>(exception);
    }

    [Fact]
    public void Create_EmptyCiudad_ThrowsArgumentException()
    {
        // GIVEN: Empty ciudad (required field per FR1)
        // WHEN: ClienteEntity.Create is called with empty ciudad
        // THEN: ArgumentException is thrown
        var exception = Record.Exception(() =>
            ClienteEntity.Create("Empresa Válida", "900001001", "3001111111", string.Empty));

        Assert.NotNull(exception);
        Assert.IsType<ArgumentException>(exception);
    }

    [Theory]
    [InlineData("   ")]
    [InlineData("\t")]
    [InlineData("\n")]
    public void Create_WhitespaceOnlyNombre_ThrowsArgumentException(string whitespaceNombre)
    {
        // GIVEN: Whitespace-only nombre (must be treated as empty — company standard: ArgumentException.ThrowIfNullOrWhiteSpace)
        // WHEN: Factory is called with whitespace nombre
        // THEN: ArgumentException is thrown
        var exception = Record.Exception(() =>
            ClienteEntity.Create(whitespaceNombre, "900001001", "3001111111", "Bogotá"));

        Assert.NotNull(exception);
        Assert.IsType<ArgumentException>(exception);
    }

    [Theory]
    [InlineData("   ")]
    [InlineData("\t")]
    public void Create_WhitespaceOnlyNitRuc_ThrowsArgumentException(string whitespaceNitRuc)
    {
        // GIVEN: Whitespace-only NitRuc
        // WHEN: Factory is called
        // THEN: ArgumentException is thrown
        var exception = Record.Exception(() =>
            ClienteEntity.Create("Empresa Válida", whitespaceNitRuc, "3001111111", "Bogotá"));

        Assert.NotNull(exception);
        Assert.IsType<ArgumentException>(exception);
    }

    [Fact]
    public void Create_NullNombre_ThrowsArgumentException()
    {
        // GIVEN: null nombre
        // WHEN: Factory is called with null
        // THEN: ArgumentException is thrown
        var exception = Record.Exception(() =>
            ClienteEntity.Create(null!, "900001001", "3001111111", "Bogotá"));

        Assert.NotNull(exception);
        Assert.IsType<ArgumentException>(exception);
    }

    [Fact]
    public void Create_NullNitRuc_ThrowsArgumentException()
    {
        // GIVEN: null nitRuc
        // WHEN: Factory is called with null
        // THEN: ArgumentException is thrown
        var exception = Record.Exception(() =>
            ClienteEntity.Create("Empresa Válida", null!, "3001111111", "Bogotá"));

        Assert.NotNull(exception);
        Assert.IsType<ArgumentException>(exception);
    }
}
