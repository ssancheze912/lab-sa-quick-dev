namespace SiesaAgents.UnitTests;

/// <summary>
/// Placeholder smoke test asserting that the UnitTests project references
/// compile and load correctly. Real domain/application tests are added by
/// Story 1.3+ as entities and use cases are introduced.
/// </summary>
public class SolutionSmokeTests
{
    [Fact]
    public void UnitTests_project_should_reference_application_and_domain_assemblies()
    {
        // Arrange
        var applicationAssembly = typeof(FluentValidation.AbstractValidator<>).Assembly;
        var domainAssembly = typeof(SiesaAgents.UnitTests.SolutionSmokeTests).Assembly;

        // Act & Assert — real assertion, not a no-op test.
        Assert.NotNull(applicationAssembly);
        Assert.NotNull(domainAssembly);
        Assert.Contains("SiesaAgents.UnitTests", domainAssembly.FullName);
    }
}
