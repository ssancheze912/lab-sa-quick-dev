using SiesaAgents.Domain.Entities;

namespace SiesaAgents.UnitTests;

public class PlaceholderTest
{
    [Fact]
    public void Entity_CreatedWith_NonEmptyGuidId()
    {
        // Arrange / Act — instantiate a concrete subclass to verify base Entity
        var entity = new TestEntity();

        // Assert — UUID is generated and non-empty
        Assert.NotEqual(Guid.Empty, entity.Id);
    }

    [Fact]
    public void Entity_CreatedAt_UsesDateTimeOffset_NotDateTime()
    {
        // Arrange / Act
        var before = DateTimeOffset.UtcNow;
        var entity = new TestEntity();
        var after = DateTimeOffset.UtcNow;

        // Assert — CreatedAt is a DateTimeOffset within the expected range
        Assert.True(entity.CreatedAt >= before && entity.CreatedAt <= after);
    }

    // Minimal concrete subclass to test base Entity
    private sealed class TestEntity : Entity { }
}
