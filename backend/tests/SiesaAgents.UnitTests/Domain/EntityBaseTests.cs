using SiesaAgents.Domain.Entities;
using Xunit;

namespace SiesaAgents.UnitTests.Domain;

/// <summary>
/// Concrete Entity for testing the abstract base class.
/// </summary>
internal sealed class TestEntity : Entity
{
    public static TestEntity Create() => new TestEntity();
}

public class EntityBaseTests
{
    [Fact]
    public void Entity_WhenCreated_ShouldHaveNonEmptyGuidId()
    {
        // Arrange + Act
        var entity = TestEntity.Create();

        // Assert
        Assert.NotEqual(Guid.Empty, entity.Id);
    }

    [Fact]
    public void Entity_WhenCreated_ShouldHaveCreatedAtAsDateTimeOffset()
    {
        // Arrange + Act
        var entity = TestEntity.Create();

        // Assert — DateTimeOffset, never DateTime per company standards
        Assert.True(entity.CreatedAt <= DateTimeOffset.UtcNow);
        Assert.True(entity.CreatedAt > DateTimeOffset.UtcNow.AddSeconds(-5));
    }

    [Fact]
    public void Entity_WhenCreated_IdsShouldBeUnique()
    {
        // Arrange + Act
        var entity1 = TestEntity.Create();
        var entity2 = TestEntity.Create();

        // Assert
        Assert.NotEqual(entity1.Id, entity2.Id);
    }
}
