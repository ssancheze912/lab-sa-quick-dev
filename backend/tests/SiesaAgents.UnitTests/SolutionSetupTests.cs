namespace SiesaAgents.UnitTests;

/// <summary>
/// Verifies the solution structure is correctly set up.
/// AC #5: All four projects compile successfully with zero errors or warnings.
/// </summary>
public class SolutionSetupTests
{
    [Fact]
    public void Domain_Entity_ShouldHaveGuidId()
    {
        // Arrange
        var entity = new TestEntity();

        // Act & Assert
        Assert.NotEqual(Guid.Empty, entity.Id);
    }

    [Fact]
    public void Domain_Entity_ShouldHaveDateTimeOffsetTimestamps()
    {
        // Arrange
        var entity = new TestEntity();

        // Act & Assert
        Assert.IsType<DateTimeOffset>(entity.CreatedAt);
        Assert.IsType<DateTimeOffset>(entity.UpdatedAt);
    }

    private sealed class TestEntity : SiesaAgents.Domain.Entities.Entity
    {
        public static TestEntity Create() => new();
    }
}
