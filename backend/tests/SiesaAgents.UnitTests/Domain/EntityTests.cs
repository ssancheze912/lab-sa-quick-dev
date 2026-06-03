using SiesaAgents.Domain.Entities;
using Xunit;

namespace SiesaAgents.UnitTests.Domain;

public class EntityTests
{
    private class TestEntity : Entity { }

    [Fact]
    public void Entity_ShouldHaveNonEmptyGuidId_WhenCreated()
    {
        // Arrange & Act
        var entity = new TestEntity();

        // Assert
        Assert.NotEqual(Guid.Empty, entity.Id);
    }

    [Fact]
    public void Entity_ShouldHaveUniqueIds_WhenMultipleCreated()
    {
        // Arrange & Act
        var entity1 = new TestEntity();
        var entity2 = new TestEntity();

        // Assert
        Assert.NotEqual(entity1.Id, entity2.Id);
    }

    [Fact]
    public void Entity_ShouldUseDateTimeOffset_ForTimestamps()
    {
        // Arrange & Act
        var before = DateTimeOffset.UtcNow.AddSeconds(-1);
        var entity = new TestEntity();
        var after = DateTimeOffset.UtcNow.AddSeconds(1);

        // Assert
        Assert.True(entity.CreatedAt >= before);
        Assert.True(entity.CreatedAt <= after);
        Assert.True(entity.UpdatedAt >= before);
        Assert.True(entity.UpdatedAt <= after);
    }
}
