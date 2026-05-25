/**
 * Story 2.1: Client List &amp; Search
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (Domain Unit Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — ClienteEntity.Create() factory method sets all fields correctly
 *   AC1 — Id is a non-empty Guid after creation
 *   Task 8 — CreatedAt and UpdatedAt are DateTimeOffset (NEVER DateTime)
 *
 * RED phase: These tests fail because:
 *   1. SiesaAgents.Domain project does NOT yet have Clientes/Entities/ folder
 *   2. ClienteEntity.cs does not exist yet
 *   3. Static Create() factory method not implemented
 */

using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.UnitTests.Domain.Clientes;

/// &lt;summary&gt;
/// Unit tests for the ClienteEntity domain entity (Story 2.1, Task 8).
/// Validates factory method, field assignment, and DateTimeOffset constraint.
/// &lt;/summary&gt;
public class ClienteEntityTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // ClienteEntity.Create() — factory method correctness
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Create_SetsNombreCorrectly()
    {
        // Given: Valid client parameters
        // When: Create factory method is called
        // Then: Nombre field matches input

        // Arrange
        const string nombre = "ACME S.A.";

        // Act
        var cliente = ClienteEntity.Create(nombre, "900123456-1", "6014567890", "Bogotá");

        // Assert
        Assert.Equal(nombre, cliente.Nombre);
    }

    [Fact]
    public void Create_SetsNitCorrectly()
    {
        // Given: Valid client parameters
        // When: Create factory method is called
        // Then: Nit field matches input

        // Arrange
        const string nit = "900123456-1";

        // Act
        var cliente = ClienteEntity.Create("ACME S.A.", nit, "6014567890", "Bogotá");

        // Assert
        Assert.Equal(nit, cliente.Nit);
    }

    [Fact]
    public void Create_SetsTelefonoCorrectly()
    {
        // Given: Valid client parameters
        // When: Create factory method is called
        // Then: Telefono field matches input

        // Arrange
        const string telefono = "6014567890";

        // Act
        var cliente = ClienteEntity.Create("ACME S.A.", "900123456-1", telefono, "Bogotá");

        // Assert
        Assert.Equal(telefono, cliente.Telefono);
    }

    [Fact]
    public void Create_SetsCiudadCorrectly()
    {
        // Given: Valid client parameters
        // When: Create factory method is called
        // Then: Ciudad field matches input

        // Arrange
        const string ciudad = "Bogotá";

        // Act
        var cliente = ClienteEntity.Create("ACME S.A.", "900123456-1", "6014567890", ciudad);

        // Assert
        Assert.Equal(ciudad, cliente.Ciudad);
    }

    [Fact]
    public void Create_AssignsNonEmptyGuidId()
    {
        // Given: Valid client parameters
        // When: Create factory method is called
        // Then: Id is a non-empty Guid (UUID v4 style)

        // Act
        var cliente = ClienteEntity.Create("ACME S.A.", "900123456-1", "6014567890", "Bogotá");

        // Assert — Id must be set and not the default empty Guid
        Assert.NotEqual(Guid.Empty, cliente.Id);
    }

    [Fact]
    public void Create_TwoCallsProduceDifferentIds()
    {
        // Given: Two separate calls to Create
        // When: Both entities are created
        // Then: Each has a unique Id (no shared state)

        // Act
        var cliente1 = ClienteEntity.Create("ACME S.A.", "900123456-1", "6014567890", "Bogotá");
        var cliente2 = ClienteEntity.Create("Beta Corp", "900200002-2", "3002222222", "Medellín");

        // Assert
        Assert.NotEqual(cliente1.Id, cliente2.Id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DateTimeOffset constraint — NEVER DateTime (company critical rule)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Create_SetsCreatedAtAsDateTimeOffset()
    {
        // Given: A call to Create with valid parameters
        // When: The entity is created
        // Then: CreatedAt is of type DateTimeOffset (NOT DateTime)
        //
        // RED: Fails because ClienteEntity does not exist yet.
        // Once implemented, CreatedAt MUST be DateTimeOffset — company standard.

        // Act
        var cliente = ClienteEntity.Create("ACME S.A.", "900123456-1", "6014567890", "Bogotá");

        // Assert — compile-time: property type is DateTimeOffset (not DateTime)
        // We verify the value is a valid UTC DateTimeOffset close to now
        Assert.IsType<DateTimeOffset>(cliente.CreatedAt);
        Assert.NotEqual(default, cliente.CreatedAt);
    }

    [Fact]
    public void Create_SetsUpdatedAtAsDateTimeOffset()
    {
        // Given: A call to Create with valid parameters
        // When: The entity is created
        // Then: UpdatedAt is of type DateTimeOffset (NOT DateTime)

        // Act
        var cliente = ClienteEntity.Create("ACME S.A.", "900123456-1", "6014567890", "Bogotá");

        // Assert
        Assert.IsType<DateTimeOffset>(cliente.UpdatedAt);
        Assert.NotEqual(default, cliente.UpdatedAt);
    }

    [Fact]
    public void Create_SetsCreatedAtToUtcNow()
    {
        // Given: The current time is known approximately
        // When: Create is called
        // Then: CreatedAt is within 5 seconds of UtcNow (set during factory call)

        // Arrange
        var before = DateTimeOffset.UtcNow.AddSeconds(-5);

        // Act
        var cliente = ClienteEntity.Create("ACME S.A.", "900123456-1", "6014567890", "Bogotá");
        var after = DateTimeOffset.UtcNow.AddSeconds(5);

        // Assert — CreatedAt is in the expected UTC range
        Assert.InRange(cliente.CreatedAt, before, after);
    }

    [Fact]
    public void Create_SetsUpdatedAtEqualToCreatedAt_OnInitialCreation()
    {
        // Given: A newly created entity
        // When: Create is called
        // Then: UpdatedAt equals CreatedAt (no update has occurred)

        // Act
        var cliente = ClienteEntity.Create("ACME S.A.", "900123456-1", "6014567890", "Bogotá");

        // Assert — on initial creation, both timestamps are set simultaneously
        // Allow 1-second tolerance for clock drift
        Assert.True(
            Math.Abs((cliente.UpdatedAt - cliente.CreatedAt).TotalSeconds) < 1,
            $"UpdatedAt ({cliente.UpdatedAt}) should equal CreatedAt ({cliente.CreatedAt}) within 1 second"
        );
    }
}
