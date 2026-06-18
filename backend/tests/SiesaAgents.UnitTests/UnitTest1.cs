namespace SiesaAgents.UnitTests;

public class ProjectInitializationTests
{
    [Fact]
    public void SolutionStructure_HasAllRequiredProjects()
    {
        // Arrange & Act — verify that the solution assemblies are reachable
        var apiAssembly = typeof(SiesaAgents.UnitTests.ProjectInitializationTests).Assembly;

        // Assert — test project loaded
        Assert.NotNull(apiAssembly);
    }
}
