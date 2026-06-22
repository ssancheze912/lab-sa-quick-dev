using SiesaAgents.Domain.Entities;

namespace SiesaAgents.UnitTests.Domain;

/// <summary>
/// Tests for the base Entity class per Story 1.1 AC#5 foundation requirements.
/// </summary>
public class EntityTests
{
    private class TestEntity : Entity
    {
        public static TestEntity Create() => new();
    }

    [Fact]
    public void Entity_WhenCreated_HasNewGuidId()
    {
        // Arrange & Act
        var entity = TestEntity.Create();

        // Assert
        Assert.NotEqual(Guid.Empty, entity.Id);
    }

    [Fact]
    public void Entity_WhenCreated_HasUtcCreatedAt()
    {
        // Arrange & Act
        var before = DateTimeOffset.UtcNow;
        var entity = TestEntity.Create();
        var after = DateTimeOffset.UtcNow;

        // Assert
        Assert.True(entity.CreatedAt >= before && entity.CreatedAt <= after);
    }

    [Fact]
    public void Entity_TwoInstances_HaveDifferentIds()
    {
        // Arrange & Act
        var entity1 = TestEntity.Create();
        var entity2 = TestEntity.Create();

        // Assert
        Assert.NotEqual(entity1.Id, entity2.Id);
    }
}
