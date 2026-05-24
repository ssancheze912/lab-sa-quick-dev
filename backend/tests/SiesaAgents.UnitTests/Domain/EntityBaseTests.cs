using SiesaAgents.Domain.Entities;
using Xunit;

namespace SiesaAgents.UnitTests.Domain;

public class EntityBaseTests
{
    private class TestEntity : Entity { }

    [Fact]
    public void Entity_WhenCreated_ShouldHaveNonEmptyId()
    {
        var entity = new TestEntity();
        Assert.NotEqual(Guid.Empty, entity.Id);
    }

    [Fact]
    public void Entity_WhenCreated_ShouldHaveCreatedAtSetToUtcNow()
    {
        var before = DateTimeOffset.UtcNow;
        var entity = new TestEntity();
        var after = DateTimeOffset.UtcNow;

        Assert.True(entity.CreatedAt >= before && entity.CreatedAt <= after);
    }

    [Fact]
    public void Entity_WhenCreated_IdShouldBeUnique()
    {
        var entity1 = new TestEntity();
        var entity2 = new TestEntity();
        Assert.NotEqual(entity1.Id, entity2.Id);
    }
}
