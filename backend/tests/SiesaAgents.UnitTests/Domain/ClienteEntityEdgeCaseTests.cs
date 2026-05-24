using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.UnitTests.Domain;

/// <summary>
/// Edge case and boundary condition tests for ClienteEntity.
/// Expands coverage beyond the ATDD happy-path tests in ClienteEntityTests.cs.
/// Story 1.1 — Project Initialization &amp; Repository Structure
/// </summary>
public class ClienteEntityEdgeCaseTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Create — boundary conditions on required fields
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Create_WithWhitespaceOnlyNombre_ThrowsArgumentException()
    {
        // GIVEN: A nombre value that is only whitespace (passes null check, fails business rule)
        // WHEN: ClienteEntity.Create is called with whitespace nombre
        // THEN: ArgumentException is thrown (whitespace is not a valid business name)
        Assert.Throws<ArgumentException>(() => ClienteEntity.Create("   ", "900-1", null, null));
    }

    [Fact]
    public void Create_WithEmptyNit_ThrowsArgumentException()
    {
        // GIVEN: An empty NIT string
        // WHEN: ClienteEntity.Create is called
        // THEN: ArgumentException is thrown — NIT is a required field
        Assert.Throws<ArgumentException>(() => ClienteEntity.Create("Empresa ABC", "", null, null));
    }

    [Fact]
    public void Create_WithWhitespaceOnlyNit_ThrowsArgumentException()
    {
        // GIVEN: A NIT value that is only whitespace
        // WHEN: ClienteEntity.Create is called
        // THEN: ArgumentException is thrown
        Assert.Throws<ArgumentException>(() => ClienteEntity.Create("Empresa ABC", "   ", null, null));
    }

    [Fact]
    public void Create_WithNullNombre_ThrowsArgumentException()
    {
        // GIVEN: A null nombre (violates the non-nullable contract)
        // WHEN: ClienteEntity.Create is called with null nombre
        // THEN: ArgumentException (or ArgumentNullException) is thrown
        Assert.ThrowsAny<ArgumentException>(() => ClienteEntity.Create(null!, "900-1", null, null));
    }

    [Fact]
    public void Create_WithNullNit_ThrowsArgumentException()
    {
        // GIVEN: A null NIT
        // WHEN: ClienteEntity.Create is called
        // THEN: ArgumentException (or ArgumentNullException) is thrown
        Assert.ThrowsAny<ArgumentException>(() => ClienteEntity.Create("Empresa ABC", null!, null, null));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Create — unique identity guarantee
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Create_TwoInstances_HaveDifferentIds()
    {
        // GIVEN: The domain assigns a new Guid on every Create call
        // WHEN: Two ClienteEntity instances are created
        var clienteA = ClienteEntity.Create("Empresa A", "900-1", null, null);
        var clienteB = ClienteEntity.Create("Empresa B", "900-2", null, null);

        // THEN: Each instance has a distinct, non-Empty Guid
        Assert.NotEqual(clienteA.Id, clienteB.Id);
        Assert.NotEqual(Guid.Empty, clienteA.Id);
        Assert.NotEqual(Guid.Empty, clienteB.Id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Create — NIT format with hyphen (common Colombian NIT pattern)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Create_WithHyphenatedNit_Succeeds()
    {
        // GIVEN: Colombian NITs use the format "XXXXXXXXX-V" (verification digit after hyphen)
        // WHEN: ClienteEntity.Create is called with this format
        var cliente = ClienteEntity.Create("Empresa", "900123456-1", null, null);

        // THEN: NIT is stored as-is without transformation
        Assert.Equal("900123456-1", cliente.Nit);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Create — optional fields accept null
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Create_WithNullOptionalFields_StoresNulls()
    {
        // GIVEN: Telefono and Ciudad are optional
        // WHEN: ClienteEntity.Create is called with null optional fields
        var cliente = ClienteEntity.Create("Empresa", "900-1", null, null);

        // THEN: Optional fields are null, required fields are populated
        Assert.Null(cliente.Telefono);
        Assert.Null(cliente.Ciudad);
        Assert.Equal("Empresa", cliente.Nombre);
    }

    [Fact]
    public void Create_WithAllOptionalFieldsProvided_StoresAllValues()
    {
        // GIVEN: All optional fields are provided
        // WHEN: ClienteEntity.Create is called with all fields
        var cliente = ClienteEntity.Create("Empresa XYZ", "123-4", "+57 300 000 0000", "Bogotá");

        // THEN: All fields are stored correctly
        Assert.Equal("+57 300 000 0000", cliente.Telefono);
        Assert.Equal("Bogotá", cliente.Ciudad);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Create — timestamps are set to a recent UTC moment
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Create_SetsCreatedAtAndUpdatedAtToCurrentUtcTime()
    {
        // GIVEN: A DateTimeOffset snapshot before creation
        var before = DateTimeOffset.UtcNow.AddSeconds(-1);

        // WHEN: ClienteEntity is created
        var cliente = ClienteEntity.Create("Empresa", "900-1", null, null);
        var after = DateTimeOffset.UtcNow.AddSeconds(1);

        // THEN: Both timestamps fall within the expected window
        Assert.InRange(cliente.CreatedAt, before, after);
        Assert.InRange(cliente.UpdatedAt, before, after);
    }

    [Fact]
    public void Create_CreatedAtEqualsUpdatedAtOnCreation()
    {
        // GIVEN: A fresh entity has never been updated
        // WHEN: ClienteEntity is created
        var cliente = ClienteEntity.Create("Empresa", "900-1", null, null);

        // THEN: CreatedAt and UpdatedAt are the same (both set in Create factory)
        // Allow 10ms tolerance for same-call assignment
        Assert.True(
            Math.Abs((cliente.CreatedAt - cliente.UpdatedAt).TotalMilliseconds) < 10,
            "CreatedAt and UpdatedAt should be equal on creation"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Update — error paths
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Update_WithEmptyNombre_ThrowsArgumentException()
    {
        // GIVEN: An existing ClienteEntity
        var cliente = ClienteEntity.Create("Empresa Inicial", "900-1", null, null);

        // WHEN: Update is called with an empty nombre
        // THEN: ArgumentException is thrown — nombre cannot be emptied
        Assert.Throws<ArgumentException>(() => cliente.Update("", null, null));
    }

    [Fact]
    public void Update_WithWhitespaceNombre_ThrowsArgumentException()
    {
        // GIVEN: An existing ClienteEntity
        var cliente = ClienteEntity.Create("Empresa Inicial", "900-1", null, null);

        // WHEN: Update is called with whitespace nombre
        // THEN: ArgumentException is thrown
        Assert.Throws<ArgumentException>(() => cliente.Update("   ", null, null));
    }

    [Fact]
    public void Update_WithNullNombre_ThrowsArgumentException()
    {
        // GIVEN: An existing ClienteEntity
        var cliente = ClienteEntity.Create("Empresa Inicial", "900-1", null, null);

        // WHEN: Update is called with null nombre
        // THEN: ArgumentException is thrown
        Assert.ThrowsAny<ArgumentException>(() => cliente.Update(null!, null, null));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Update — NIT cannot be changed (immutable after creation)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Update_DoesNotChangeNit()
    {
        // GIVEN: An existing ClienteEntity with a specific NIT
        var cliente = ClienteEntity.Create("Empresa", "900-1", null, null);
        var originalNit = cliente.Nit;

        // WHEN: Update is called (NIT has no parameter in Update signature)
        cliente.Update("Empresa Modificada", null, null);

        // THEN: NIT remains unchanged — it is immutable after creation
        Assert.Equal(originalNit, cliente.Nit);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Update — UpdatedAt advances but CreatedAt remains unchanged
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Update_UpdatedAtAdvancesAndCreatedAtRemainsUnchanged()
    {
        // GIVEN: An existing entity with known timestamps
        var cliente = ClienteEntity.Create("Empresa", "900-1", null, null);
        var originalCreatedAt = cliente.CreatedAt;
        var originalUpdatedAt = cliente.UpdatedAt;

        // WHEN: Update is called
        cliente.Update("Empresa Modificada", null, null);

        // THEN: CreatedAt is never modified; UpdatedAt is >= the original
        Assert.Equal(originalCreatedAt, cliente.CreatedAt);
        Assert.True(cliente.UpdatedAt >= originalUpdatedAt);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Update — optional fields can be set to null (clearing a field)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Update_CanClearOptionalFieldsByPassingNull()
    {
        // GIVEN: An entity with all optional fields set
        var cliente = ClienteEntity.Create("Empresa", "900-1", "+57 300 0000", "Medellín");

        // WHEN: Update is called with null optional fields
        cliente.Update("Empresa", null, null);

        // THEN: Optional fields are cleared to null
        Assert.Null(cliente.Telefono);
        Assert.Null(cliente.Ciudad);
    }
}
