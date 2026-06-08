// Story 2.1: Client List & Search
// Epic 2: Client Management
//
// ATDD Acceptance Tests — RED Phase (Domain — pure unit tests)
// These tests are intentionally FAILING until SiesaAgents.Domain.Entities.ClienteEntity exists.
//
// Acceptance Criteria covered:
//   AC #1 — The clientes table schema is materialized from this entity (DateTimeOffset, required fields).
//   AC #12 — Backend unit coverage for the entity creation + validation contract.
//
// Test Design references:
//   Domain invariants enforced via Create factory (first line of defense — see Dev Notes table).
//
// Strategy: Verify the static factory `ClienteEntity.Create(...)` enforces
// non-null/non-whitespace inputs, generates a UUID, and stamps DateTimeOffset
// timestamps in UTC at creation time.

using SiesaAgents.Domain.Entities;

namespace SiesaAgents.UnitTests.Domain;

public class ClienteEntityTests
{
    private const string ValidNombre = "Acme S.A.";
    private const string ValidNit = "900123456-1";
    private const string ValidTelefono = "3001234567";
    private const string ValidCiudad = "Bogotá";

    [Fact]
    public void Create_WithAllFields_ReturnsEntityWithGeneratedIdAndUtcTimestamps()
    {
        // GIVEN: Valid inputs for every required column
        var before = DateTimeOffset.UtcNow;

        // WHEN: The entity is materialized through the factory
        var entity = ClienteEntity.Create(ValidNombre, ValidNit, ValidTelefono, ValidCiudad);

        var after = DateTimeOffset.UtcNow;

        // THEN: The Id is a non-empty Guid, fields are persisted verbatim, and timestamps are UTC + within the window
        Assert.NotEqual(Guid.Empty, entity.Id);
        Assert.Equal(ValidNombre, entity.Nombre);
        Assert.Equal(ValidNit, entity.Nit);
        Assert.Equal(ValidTelefono, entity.Telefono);
        Assert.Equal(ValidCiudad, entity.Ciudad);

        Assert.InRange(entity.CreatedAt, before.AddSeconds(-1), after.AddSeconds(1));
        Assert.InRange(entity.UpdatedAt, before.AddSeconds(-1), after.AddSeconds(1));
        Assert.Equal(TimeSpan.Zero, entity.CreatedAt.Offset);
        Assert.Equal(TimeSpan.Zero, entity.UpdatedAt.Offset);
    }

    [Fact]
    public void Create_AssignsEqualCreatedAtAndUpdatedAtAtCreationTime()
    {
        // GIVEN: Valid inputs
        // WHEN: The entity is created
        var entity = ClienteEntity.Create(ValidNombre, ValidNit, ValidTelefono, ValidCiudad);

        // THEN: Both timestamps coincide at creation (UpdatedAt is mutated only on update)
        Assert.Equal(entity.CreatedAt, entity.UpdatedAt);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WithNullOrWhitespaceNombre_Throws(string? invalid)
    {
        // GIVEN: An invalid `nombre`
        // WHEN: The factory is invoked
        var ex = Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create(invalid!, ValidNit, ValidTelefono, ValidCiudad));

        // THEN: The exception message identifies the offending field
        Assert.Contains("nombre", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WithNullOrWhitespaceNit_Throws(string? invalid)
    {
        // GIVEN: An invalid `nit`
        // WHEN: The factory is invoked
        var ex = Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create(ValidNombre, invalid!, ValidTelefono, ValidCiudad));

        // THEN: The exception message identifies the offending field
        Assert.Contains("nit", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WithNullOrWhitespaceTelefono_Throws(string? invalid)
    {
        // GIVEN: An invalid `telefono`
        // WHEN: The factory is invoked
        var ex = Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create(ValidNombre, ValidNit, invalid!, ValidCiudad));

        // THEN: The exception message identifies the offending field
        Assert.Contains("telefono", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WithNullOrWhitespaceCiudad_Throws(string? invalid)
    {
        // GIVEN: An invalid `ciudad`
        // WHEN: The factory is invoked
        var ex = Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create(ValidNombre, ValidNit, ValidTelefono, invalid!));

        // THEN: The exception message identifies the offending field
        Assert.Contains("ciudad", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Timestamps_AreDateTimeOffsetType_NeverDateTime()
    {
        // GIVEN: The entity type metadata
        var createdAtProp = typeof(ClienteEntity).GetProperty(nameof(ClienteEntity.CreatedAt));
        var updatedAtProp = typeof(ClienteEntity).GetProperty(nameof(ClienteEntity.UpdatedAt));

        // WHEN / THEN: Both properties MUST be DateTimeOffset (company-standards.md#Backend Critical Rules)
        Assert.NotNull(createdAtProp);
        Assert.NotNull(updatedAtProp);
        Assert.Equal(typeof(DateTimeOffset), createdAtProp!.PropertyType);
        Assert.Equal(typeof(DateTimeOffset), updatedAtProp!.PropertyType);
    }
}
