using SiesaAgents.Domain.Entities;

namespace SiesaAgents.UnitTests;

/// <summary>
/// Smoke tests for the Domain Entity base class.
/// Verifies UUID primary-key generation required by company standards.
/// </summary>
public class EntityTests
{
    private class ConcreteEntity : Entity { }

    [Fact]
    public void Entity_Id_ShouldBeNonEmpty_Guid()
    {
        // Arrange / Act
        var entity = new ConcreteEntity();

        // Assert
        Assert.NotEqual(Guid.Empty, entity.Id);
    }

    [Fact]
    public void Entity_TwoInstances_ShouldHaveDistinct_Ids()
    {
        // Arrange / Act
        var first = new ConcreteEntity();
        var second = new ConcreteEntity();

        // Assert
        Assert.NotEqual(first.Id, second.Id);
    }
}
