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
        // Arrange / Act
        var entity = new TestableEntity();

        // Assert — UUID PK rule: never Guid.Empty
        Assert.NotEqual(Guid.Empty, entity.Id);
    }

    [Fact]
    public void Entity_Id_IsGuid_Type()
    {
        var entity = new TestableEntity();

        // Assert — PKs must be Guid (UUID), never int or string
        Assert.IsType<Guid>(entity.Id);
    }

    [Fact]
    public void Entity_TwoInstances_HaveDistinct_Ids()
    {
        var entity1 = new TestableEntity();
        var entity2 = new TestableEntity();

        Assert.NotEqual(entity1.Id, entity2.Id);
    }

    [Fact]
    public void Entity_CreatedAt_IsDateTimeOffset_SetToUtcNow()
    {
        var before = DateTimeOffset.UtcNow;
        var entity = new TestableEntity();
        var after = DateTimeOffset.UtcNow;

        // Assert — timestamps must be DateTimeOffset (never DateTime per architecture rules)
        Assert.InRange(entity.CreatedAt, before, after);
    }

    [Fact]
    public void Entity_UpdatedAt_IsDateTimeOffset_SetToUtcNow()
    {
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
