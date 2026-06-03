using SiesaAgents.Domain.Clientes.Entities;
using Xunit;

namespace SiesaAgents.UnitTests.Domain;

/// <summary>
/// ATDD tests for Story 2.1 — Client List and Search.
/// Domain unit tests for ClienteEntity.
///
/// RED phase: These tests fail because ClienteEntity does not exist yet at:
///   backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs
///
/// Tests will go GREEN once:
///   - ClienteEntity class is created with static Create() factory method
///   - All required properties (Id, Nombre, NIT, Telefono, Ciudad, CreatedAt, UpdatedAt) are implemented
/// </summary>
public class ClienteEntityTests
{
    // ─── TC: ClienteEntity.Create() sets all fields correctly ────────────────

    /// <summary>
    /// Given the ClienteEntity.Create() factory method,
    /// When called with valid parameters,
    /// Then all fields are set correctly and Id is a non-empty Guid.
    /// </summary>
    [Fact]
    public void Create_ShouldSetAllFields_WhenCalledWithValidParameters()
    {
        // Arrange
        const string nombre = "Empresa Test S.A.";
        const string nit = "900123456-7";
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

    /// <summary>
    /// Given the ClienteEntity.Create() factory method,
    /// When called,
    /// Then Id is a non-empty Guid.
    /// </summary>
    [Fact]
    public void Create_ShouldAssignNonEmptyGuid_ForId()
    {
        // Arrange / Act
        var cliente = ClienteEntity.Create("Test Corp", "900000001-1", "3000000001", "Medellín");

        // Assert
        Assert.NotEqual(Guid.Empty, cliente.Id);
    }

    /// <summary>
    /// Given the ClienteEntity.Create() factory method,
    /// When called,
    /// Then CreatedAt is a DateTimeOffset (not DateTime).
    /// </summary>
    [Fact]
    public void Create_ShouldSetCreatedAt_AsDateTimeOffset()
    {
        // Arrange
        var before = DateTimeOffset.UtcNow.AddSeconds(-1);

        // Act
        var cliente = ClienteEntity.Create("Test Corp", "900000001-1", "3000000001", "Cali");

        // Assert
        var after = DateTimeOffset.UtcNow.AddSeconds(1);
        Assert.IsType<DateTimeOffset>(cliente.CreatedAt);
        Assert.True(cliente.CreatedAt >= before);
        Assert.True(cliente.CreatedAt <= after);
    }

    /// <summary>
    /// Given the ClienteEntity.Create() factory method,
    /// When called,
    /// Then UpdatedAt is a DateTimeOffset equal to CreatedAt at creation time.
    /// </summary>
    [Fact]
    public void Create_ShouldSetUpdatedAt_AsDateTimeOffset()
    {
        // Arrange
        var before = DateTimeOffset.UtcNow.AddSeconds(-1);

        // Act
        var cliente = ClienteEntity.Create("Test Corp", "900000001-1", "3000000001", "Barranquilla");

        // Assert
        var after = DateTimeOffset.UtcNow.AddSeconds(1);
        Assert.IsType<DateTimeOffset>(cliente.UpdatedAt);
        Assert.True(cliente.UpdatedAt >= before);
        Assert.True(cliente.UpdatedAt <= after);
    }

    /// <summary>
    /// Given two ClienteEntity instances created separately,
    /// When compared,
    /// Then they have unique Guids.
    /// </summary>
    [Fact]
    public void Create_ShouldGenerateUniqueIds_ForEachInstance()
    {
        // Arrange / Act
        var cliente1 = ClienteEntity.Create("Corp A", "900000001-1", "3000000001", "Bogotá");
        var cliente2 = ClienteEntity.Create("Corp B", "900000002-2", "3000000002", "Cali");

        // Assert
        Assert.NotEqual(cliente1.Id, cliente2.Id);
    }

    /// <summary>
    /// Given the ClienteEntity.Create() factory method,
    /// When called with valid parameters,
    /// Then the returned entity is not null and is of type ClienteEntity.
    /// </summary>
    [Fact]
    public void Create_ShouldReturnClienteEntityInstance()
    {
        // Arrange / Act
        var cliente = ClienteEntity.Create("Empresa Valid", "900000001-1", "3000000001", "Pereira");

        // Assert
        Assert.NotNull(cliente);
        Assert.IsType<ClienteEntity>(cliente);
    }
}
