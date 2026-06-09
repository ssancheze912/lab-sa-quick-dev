namespace SiesaAgents.UnitTests;

public class PlaceholderTests
{
    [Fact]
    public void Solution_BuildsSuccessfully()
    {
        // Sanity test ensuring the unit test project links to Domain/Application
        Assert.NotNull(typeof(SiesaAgents.Domain.AssemblyMarker));
        Assert.NotNull(typeof(SiesaAgents.Application.AssemblyMarker));
    }
}
