using SiesaAgents.Domain.Entities;
using Xunit;

namespace SiesaAgents.UnitTests.Domain;

public class EntityTests
{
    private class TestEntity : Entity
    {
        public static TestEntity Create() => new();
    }

    [Fact]
    public void Entity_ShouldHaveNonEmptyGuidId_WhenCreated()
    {
        // Arrange / Act
        var entity = TestEntity.Create();

        // Assert
        Assert.NotEqual(Guid.Empty, entity.Id);
    }

    [Fact]
    public void TwoEntities_ShouldHaveDifferentIds_WhenCreated()
    {
        // Arrange / Act
        var entity1 = TestEntity.Create();
        var entity2 = TestEntity.Create();

        // Assert
        Assert.NotEqual(entity1.Id, entity2.Id);
    }

    [Fact]
    public void Entity_ShouldHaveEmptyDomainEvents_WhenCreated()
    {
        // Arrange / Act
        var entity = TestEntity.Create();

        // Assert
        Assert.Empty(entity.DomainEvents);
    }
}
