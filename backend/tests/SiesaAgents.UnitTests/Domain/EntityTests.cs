using SiesaAgents.Domain.Entities;
using Xunit;

namespace SiesaAgents.UnitTests.Domain;

public class EntityTests
{
    private class TestEntity : Entity
    {
        public static TestEntity Create() => new TestEntity();
        private TestEntity() { }
    }

    [Fact]
    public void Entity_CreatedWithNewGuid_HasNonEmptyId()
    {
        // Arrange / Act
        var entity = TestEntity.Create();

        // Assert
        Assert.NotEqual(Guid.Empty, entity.Id);
    }

    [Fact]
    public void Entity_CreatedWithUtcNow_HasRecentCreatedAt()
    {
        // Arrange / Act
        var before = DateTimeOffset.UtcNow.AddSeconds(-1);
        var entity = TestEntity.Create();
        var after = DateTimeOffset.UtcNow.AddSeconds(1);

        // Assert
        Assert.True(entity.CreatedAt >= before && entity.CreatedAt <= after);
    }

    [Fact]
    public void Entity_TwoCreatedEntities_HaveDifferentIds()
    {
        // Arrange / Act
        var entity1 = TestEntity.Create();
        var entity2 = TestEntity.Create();

        // Assert
        Assert.NotEqual(entity1.Id, entity2.Id);
    }
}
