/**
 * Story 2.1: Client List & Search
 * Unit Tests — ClienteEntity (RED Phase — ATDD)
 *
 * Acceptance Criteria covered:
 *   AC1 — Clients visible in list with Nombre and NIT/RUC
 *   AC5 — Each item shows at minimum Nombre and NIT/RUC
 *
 * These tests will FAIL until ClienteEntity is implemented.
 */

using SiesaAgents.Domain.Clientes.Entities;
using Xunit;

namespace SiesaAgents.UnitTests.Domain.Clientes;

public class ClienteEntityTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Given: factory method called with valid data
    // When:  Create() executes
    // Then:  entity has correct field values and non-empty Guid ID
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Create_WithValidData_ShouldReturnEntityWithCorrectFields()
    {
        // GIVEN: valid creation parameters
        const string nombre = "Empresa Alpha";
        const string nit = "900123456-1";
        const string telefono = "3001234567";
        const string ciudad = "Bogotá";

        // WHEN: factory method is called
        var cliente = ClienteEntity.Create(nombre, nit, telefono, ciudad);

        // THEN: all fields are correctly set
        Assert.Equal(nombre, cliente.Nombre);
        Assert.Equal(nit, cliente.Nit);
        Assert.Equal(telefono, cliente.Telefono);
        Assert.Equal(ciudad, cliente.Ciudad);
    }

    [Fact]
    public void Create_WithValidData_ShouldGenerateNonEmptyGuidId()
    {
        // GIVEN: valid creation parameters
        // WHEN: factory method is called
        var cliente = ClienteEntity.Create("Empresa Beta", "900000002-2", "3002222222", "Medellín");

        // THEN: Id is not Guid.Empty
        Assert.NotEqual(Guid.Empty, cliente.Id);
    }

    [Fact]
    public void Create_CalledTwice_ShouldGenerateUniqueIds()
    {
        // GIVEN: two separate Create() calls
        var cliente1 = ClienteEntity.Create("Empresa A", "900000001-1", "3001111111", "Bogotá");
        var cliente2 = ClienteEntity.Create("Empresa B", "900000002-2", "3002222222", "Cali");

        // THEN: Ids are distinct
        Assert.NotEqual(cliente1.Id, cliente2.Id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Timestamp requirements: DateTimeOffset (NEVER DateTime) per company standards
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Create_ShouldSetCreatedAtAsDateTimeOffset()
    {
        // GIVEN: a moment just before creation
        var before = DateTimeOffset.UtcNow;

        // WHEN: entity is created
        var cliente = ClienteEntity.Create("Empresa Gamma", "900000003-3", "3003333333", "Cali");

        var after = DateTimeOffset.UtcNow;

        // THEN: CreatedAt is a DateTimeOffset within the expected range
        Assert.IsType<DateTimeOffset>(cliente.CreatedAt);
        Assert.True(cliente.CreatedAt >= before && cliente.CreatedAt <= after,
            "CreatedAt should be set to UtcNow at creation time");
    }

    [Fact]
    public void Create_ShouldSetUpdatedAtAsDateTimeOffset()
    {
        // GIVEN: a moment just before creation
        var before = DateTimeOffset.UtcNow;

        // WHEN: entity is created
        var cliente = ClienteEntity.Create("Empresa Delta", "900000004-4", "3004444444", "Barranquilla");

        var after = DateTimeOffset.UtcNow;

        // THEN: UpdatedAt is a DateTimeOffset within the expected range
        Assert.IsType<DateTimeOffset>(cliente.UpdatedAt);
        Assert.True(cliente.UpdatedAt >= before && cliente.UpdatedAt <= after,
            "UpdatedAt should be set to UtcNow at creation time");
    }

    [Fact]
    public void Create_ShouldSetCreatedAtAndUpdatedAtToSameInstant()
    {
        // GIVEN: entity is just created (no update has happened)
        var cliente = ClienteEntity.Create("Empresa Epsilon", "900000005-5", "3005555555", "Cartagena");

        // THEN: CreatedAt and UpdatedAt match on initial creation
        // Allow 1ms tolerance for sequential calls
        Assert.True(Math.Abs((cliente.CreatedAt - cliente.UpdatedAt).TotalMilliseconds) < 50,
            "CreatedAt and UpdatedAt should be approximately equal on first creation");
    }
}
