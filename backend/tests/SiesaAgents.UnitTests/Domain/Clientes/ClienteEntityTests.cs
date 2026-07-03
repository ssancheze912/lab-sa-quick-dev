using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.UnitTests.Domain.Clientes;

/// <summary>
/// Story 2.1 — TC-E2-P2-02 (RED phase).
///
/// Pure reflection-based unit test asserting that the <see cref="ClienteEntity"/>
/// domain entity uses <c>DateTimeOffset</c> (never naive <c>DateTime</c>) for
/// <c>CreatedAt</c> and <c>UpdatedAt</c>. Runs everywhere — no external
/// dependencies — so this test guards R13 even when Docker is unavailable and
/// TC-E2-P2-01 self-skips.
///
/// RED-phase expectation: fails to compile until
/// <see cref="ClienteEntity"/> exists at
/// <c>backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs</c>
/// (Story 2.1 Task 1).
/// </summary>
public class ClienteEntityTests
{
    [Fact]
    public void ClienteEntity_CreatedAt_property_type_is_DateTimeOffset()
    {
        // GIVEN: The ClienteEntity type (domain layer)
        var property = typeof(ClienteEntity).GetProperty(nameof(ClienteEntity.CreatedAt));

        // WHEN: The CreatedAt property is inspected via reflection
        // THEN: Its declared type is DateTimeOffset — never DateTime
        Assert.NotNull(property);
        Assert.Equal(typeof(DateTimeOffset), property!.PropertyType);
    }

    [Fact]
    public void ClienteEntity_UpdatedAt_property_type_is_DateTimeOffset()
    {
        // GIVEN: The ClienteEntity type
        var property = typeof(ClienteEntity).GetProperty(nameof(ClienteEntity.UpdatedAt));

        // WHEN: The UpdatedAt property is inspected via reflection
        // THEN: Its declared type is DateTimeOffset
        Assert.NotNull(property);
        Assert.Equal(typeof(DateTimeOffset), property!.PropertyType);
    }

    [Fact]
    public void ClienteEntity_has_no_naive_DateTime_properties()
    {
        // GIVEN: The ClienteEntity public property surface
        var props = typeof(ClienteEntity).GetProperties();

        // WHEN: Property types are inspected
        var offendingProperties = props
            .Where(p => p.PropertyType == typeof(DateTime) || p.PropertyType == typeof(DateTime?))
            .Select(p => p.Name)
            .ToList();

        // THEN: No property uses naive DateTime — the architecture forbids it
        Assert.Empty(offendingProperties);
    }

    [Fact]
    public void ClienteEntity_Id_is_Guid()
    {
        // GIVEN: The ClienteEntity type
        var property = typeof(ClienteEntity).GetProperty(nameof(ClienteEntity.Id));

        // WHEN: The Id property is inspected via reflection
        // THEN: Its declared type is Guid (architecture UUID mandate)
        Assert.NotNull(property);
        Assert.Equal(typeof(Guid), property!.PropertyType);
    }

    [Fact]
    public void ClienteEntity_declares_all_required_domain_properties()
    {
        // GIVEN: The ClienteEntity type
        var type = typeof(ClienteEntity);

        // WHEN: The public property surface is inspected
        // THEN: All fields required by AC #8 are present
        Assert.NotNull(type.GetProperty(nameof(ClienteEntity.Id)));
        Assert.NotNull(type.GetProperty(nameof(ClienteEntity.Nombre)));
        Assert.NotNull(type.GetProperty(nameof(ClienteEntity.NitRuc)));
        Assert.NotNull(type.GetProperty(nameof(ClienteEntity.Telefono)));
        Assert.NotNull(type.GetProperty(nameof(ClienteEntity.Ciudad)));
        Assert.NotNull(type.GetProperty(nameof(ClienteEntity.CreatedAt)));
        Assert.NotNull(type.GetProperty(nameof(ClienteEntity.UpdatedAt)));
    }
}
