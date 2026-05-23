using SiesaAgents.Domain.Entities;

namespace SiesaAgents.UnitTests;

/// <summary>
/// Structural test verifying core architectural rules for the Entity base class.
/// Replaces the original placeholder assertion from Story 1.1.
/// AC5 — Solution builds; Entity follows UUID PK + DateTimeOffset audit fields convention.
/// </summary>
public class EntityStructureTests
{
    [Fact]
    public void Entity_Id_IsNonEmpty_Guid_OnCreation()
    {
        // Given: A concrete entity instance is constructed
        // When: The Id property is read immediately after construction
        // Then: It is not Guid.Empty — UUID PK rule requires auto-assigned non-empty Guid
        var entity = new TestableEntity();

        Assert.NotEqual(Guid.Empty, entity.Id);
    }

    [Fact]
    public void Entity_Id_IsGuid_Type()
    {
        // Given: A concrete entity instance is created
        // When: The Id property type is inspected
        // Then: It is of type Guid (never int or string — architectural UUID PK rule)
        var entity = new TestableEntity();

        Assert.IsType<Guid>(entity.Id);
    }

    [Fact]
    public void Entity_TwoInstances_HaveDistinct_Ids()
    {
        // Given: Two separate entity instances are created
        // When: Their Id properties are compared
        // Then: They are not equal — each gets a unique Guid via Guid.NewGuid()
        var entity1 = new TestableEntity();
        var entity2 = new TestableEntity();

        Assert.NotEqual(entity1.Id, entity2.Id);
    }

    [Fact]
    public void Entity_CreatedAt_IsDateTimeOffset_SetToUtcNow()
    {
        // Given: UTC time is recorded before and after entity construction
        // When: The entity's CreatedAt property is read
        // Then: It falls within the before/after UTC window (DateTimeOffset, never DateTime)
        var before = DateTimeOffset.UtcNow;
        var entity = new TestableEntity();
        var after = DateTimeOffset.UtcNow;

        Assert.InRange(entity.CreatedAt, before, after);
    }

    [Fact]
    public void Entity_UpdatedAt_IsDateTimeOffset_SetToUtcNow()
    {
        // Given: UTC time is recorded before and after entity construction
        // When: The entity's UpdatedAt property is read
        // Then: It falls within the before/after UTC window (DateTimeOffset, never DateTime)
        var before = DateTimeOffset.UtcNow;
        var entity = new TestableEntity();
        var after = DateTimeOffset.UtcNow;

        Assert.InRange(entity.UpdatedAt, before, after);
    }

    /// <summary>
    /// Minimal concrete entity for testing the abstract Entity base class.
    /// Must not be used in production code.
    /// </summary>
    private sealed class TestableEntity : Entity { }
}
