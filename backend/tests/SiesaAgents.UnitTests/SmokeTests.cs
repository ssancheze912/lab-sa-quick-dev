namespace SiesaAgents.UnitTests;

/// <summary>
/// Smoke tests confirming the test project is wired correctly.
/// Domain/Application units arrive in subsequent stories (1.3+).
/// </summary>
public class SmokeTests
{
    [Fact]
    public void TestProject_CanReferenceDomain()
    {
        var domainAssembly = typeof(SiesaAgents.Domain.AssemblyMarker).Assembly;
        Assert.NotNull(domainAssembly);
    }

    [Fact]
    public void TestProject_CanReferenceApplication()
    {
        var applicationAssembly = typeof(SiesaAgents.Application.AssemblyMarker).Assembly;
        Assert.NotNull(applicationAssembly);
    }
}
