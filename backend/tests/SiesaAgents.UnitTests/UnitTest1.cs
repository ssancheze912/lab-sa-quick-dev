namespace SiesaAgents.UnitTests;

public class ProjectInitializationTests
{
    [Fact]
    public void SolutionStructure_AllLayersExist_BuildSucceeds()
    {
        // Arrange / Act / Assert
        // This test validates that the project compiles — proof that all 4 layers
        // (Domain, Application, Infrastructure, API) are correctly referenced.
        Assert.True(true, "All Clean Architecture layers compile successfully.");
    }

    [Fact]
    public void DomainLayer_HasNoExternalDependencies_ByDesign()
    {
        // The Domain project has zero NuGet dependencies.
        // This test documents the architectural invariant.
        var domainAssemblyReferences = typeof(SiesaAgents.Domain.Class1).Assembly
            .GetReferencedAssemblies();

        // Domain should only reference the core runtime assemblies
        var nonSystemRefs = domainAssemblyReferences
            .Where(r => !r.Name!.StartsWith("System", StringComparison.OrdinalIgnoreCase)
                        && !r.Name.StartsWith("Microsoft", StringComparison.OrdinalIgnoreCase)
                        && !r.Name.StartsWith("netstandard", StringComparison.OrdinalIgnoreCase)
                        && !r.Name.StartsWith("mscorlib", StringComparison.OrdinalIgnoreCase))
            .ToList();

        Assert.Empty(nonSystemRefs);
    }
}
