using SiesaAgents.Domain.Entities;
using Xunit;

namespace SiesaAgents.UnitTests.Domain;

public class EntityTests
{
    private class TestEntity : Entity { }

    [Fact]
    public void Entity_WhenCreated_HasUniqueGuidId()
    {
        // Arrange & Act
        var entity1 = new TestEntity();
        var entity2 = new TestEntity();

        // Assert
        Assert.NotEqual(Guid.Empty, entity1.Id);
        Assert.NotEqual(Guid.Empty, entity2.Id);
        Assert.NotEqual(entity1.Id, entity2.Id);
    }

    [Fact]
    public void Entity_WhenCreated_HasUtcCreatedAtTimestamp()
    {
        // Arrange & Act
        var before = DateTimeOffset.UtcNow;
        var entity = new TestEntity();
        var after = DateTimeOffset.UtcNow;

        // Assert
        Assert.True(entity.CreatedAt >= before);
        Assert.True(entity.CreatedAt <= after);
    }
}
