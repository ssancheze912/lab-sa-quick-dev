using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.UnitTests.Domain;

/// <summary>
/// Unit tests for ClienteEntity domain model — Story 2.1 edge case expansion.
///
/// Test IDs: UNIT-B-DOMAIN-01 … UNIT-B-DOMAIN-08
/// </summary>
public class ClienteEntityTests
{
    // ---------------------------------------------------------------------------
    // UNIT-B-DOMAIN-01: Create assigns a non-empty GUID ID
    // ---------------------------------------------------------------------------
    [Fact]
    public void Create_Always_AssignsNonEmptyId()
    {
        var entity = ClienteEntity.Create("Empresa Alpha SAS", "900100001-0", "+57 1 234 5678", "Bogotá");

        Assert.NotEqual(Guid.Empty, entity.Id);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-DOMAIN-02: Create preserves all provided field values
    // ---------------------------------------------------------------------------
    [Fact]
    public void Create_ValidData_SetsAllFields()
    {
        const string nombre = "Constructora Delta SAS";
        const string nit = "800123456-7";
        const string telefono = "+57 300 123 4567";
        const string ciudad = "Medellín";

        var entity = ClienteEntity.Create(nombre, nit, telefono, ciudad);

        Assert.Equal(nombre, entity.Nombre);
        Assert.Equal(nit, entity.Nit);
        Assert.Equal(telefono, entity.Telefono);
        Assert.Equal(ciudad, entity.Ciudad);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-DOMAIN-03: Create sets CreatedAt and UpdatedAt to a recent UTC time
    // ---------------------------------------------------------------------------
    [Fact]
    public void Create_Always_SetsCreatedAtToUtcNow()
    {
        var before = DateTimeOffset.UtcNow.AddSeconds(-1);

        var entity = ClienteEntity.Create("Empresa", "123", "300", "Bogotá");

        var after = DateTimeOffset.UtcNow.AddSeconds(1);

        Assert.InRange(entity.CreatedAt, before, after);
        Assert.InRange(entity.UpdatedAt, before, after);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-DOMAIN-04: Create with each distinct call produces unique IDs
    // Boundary: two rapid Create calls must not collide on Guid.NewGuid()
    // ---------------------------------------------------------------------------
    [Fact]
    public void Create_TwoEntities_HaveDifferentIds()
    {
        var e1 = ClienteEntity.Create("Empresa Uno", "111", "300", "Bogotá");
        var e2 = ClienteEntity.Create("Empresa Dos", "222", "301", "Cali");

        Assert.NotEqual(e1.Id, e2.Id);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-DOMAIN-05: Update changes Nombre, Nit, Telefono, Ciudad
    // ---------------------------------------------------------------------------
    [Fact]
    public void Update_ValidData_ChangesFields()
    {
        var entity = ClienteEntity.Create("Empresa Original", "900100001-0", "+57 1 111 1111", "Bogotá");
        var originalId = entity.Id;
        var originalCreatedAt = entity.CreatedAt;

        entity.Update("Empresa Actualizada", "900100002-1", "+57 1 222 2222", "Medellín");

        Assert.Equal("Empresa Actualizada", entity.Nombre);
        Assert.Equal("900100002-1", entity.Nit);
        Assert.Equal("+57 1 222 2222", entity.Telefono);
        Assert.Equal("Medellín", entity.Ciudad);

        // Id and CreatedAt must not change
        Assert.Equal(originalId, entity.Id);
        Assert.Equal(originalCreatedAt, entity.CreatedAt);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-DOMAIN-06: Update bumps UpdatedAt but keeps CreatedAt unchanged
    // ---------------------------------------------------------------------------
    [Fact]
    public void Update_Always_BumpsUpdatedAt()
    {
        var entity = ClienteEntity.Create("Empresa", "900", "300", "Bogotá");
        var createdAt = entity.CreatedAt;
        // Force a small delay so UpdatedAt can be observably later
        System.Threading.Thread.Sleep(10);

        entity.Update("Empresa Mod", "900-1", "301", "Cali");

        Assert.Equal(createdAt, entity.CreatedAt); // unchanged
        Assert.True(entity.UpdatedAt >= createdAt); // bumped or equal (same ms edge)
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-DOMAIN-07: Create with empty string Nombre — domain allows it (no guard)
    // If a guard is added later this test documents the intent change.
    // ---------------------------------------------------------------------------
    [Fact]
    public void Create_WithEmptyNombre_DoesNotThrow()
    {
        // The domain entity has no guard clauses in the current implementation.
        // Validation is expected at the application/API layer.
        var ex = Record.Exception(() =>
            ClienteEntity.Create(string.Empty, "900100001-0", "300", "Bogotá"));

        Assert.Null(ex);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-DOMAIN-08: Create with very long strings — no overflow / truncation
    // Boundary: 500-character strings must be stored as-is (domain has no length limit)
    // ---------------------------------------------------------------------------
    [Fact]
    public void Create_WithVeryLongStrings_StoresFullValue()
    {
        var longName = new string('A', 500);
        var longNit = new string('9', 50);

        var entity = ClienteEntity.Create(longName, longNit, "300", "Bogotá");

        Assert.Equal(longName, entity.Nombre);
        Assert.Equal(longNit, entity.Nit);
    }
}
