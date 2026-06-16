// Unit tests for Story 1.1: Project Initialization & Repository Structure
using System.Reflection;

namespace SiesaAgents.UnitTests;

public class ProjectInitializationTests
{
    [Fact]
    public void Domain_Assembly_IsLoaded()
    {
        // The domain assembly should be loadable and have the expected name
        var assembly = Assembly.Load("SiesaAgents.Domain");

        Assert.NotNull(assembly);
        Assert.Equal("SiesaAgents.Domain", assembly.GetName().Name);
    }

    [Fact]
    public void Application_Assembly_IsLoaded()
    {
        var assembly = Assembly.Load("SiesaAgents.Application");

        Assert.NotNull(assembly);
        Assert.Equal("SiesaAgents.Application", assembly.GetName().Name);
    }

    [Fact]
    public void Infrastructure_Assembly_IsLoaded()
    {
        var assembly = Assembly.Load("SiesaAgents.Infrastructure");

        Assert.NotNull(assembly);
        Assert.Equal("SiesaAgents.Infrastructure", assembly.GetName().Name);
    }
}
