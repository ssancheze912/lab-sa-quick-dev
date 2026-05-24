using SiesaAgents.Domain.Entities;
using Xunit;

namespace SiesaAgents.UnitTests.Domain;

// Concrete implementation for testing abstract Entity
public sealed class TestEntity : Entity
{
    public static TestEntity Create() => new();
}

public class EntityTests
{
    [Fact]
    public void Entity_WhenCreated_HasNonEmptyGuidId()
    {
        // Arrange & Act
        var entity = TestEntity.Create();

        // Assert
        Assert.NotEqual(Guid.Empty, entity.Id);
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

    [Fact]
    public void Entity_Initially_HasNoDomainEvents()
    {
        // Arrange & Act
        var entity = TestEntity.Create();

        // Assert
        Assert.Empty(entity.DomainEvents);
    }
}
