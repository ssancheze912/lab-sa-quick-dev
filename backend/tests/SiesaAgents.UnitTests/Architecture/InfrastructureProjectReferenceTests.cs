using System.Reflection;
using Xunit;

namespace SiesaAgents.UnitTests.Architecture;

/// <summary>
/// RED-phase architecture guard for Story 1.3 AC #7.
///
/// Closes Story 1.1 review item [AI-Review][HIGH] — "Infrastructure → Application
/// project reference violates Clean Architecture". The dependency direction MUST be:
///
///   SiesaAgents.API ──► SiesaAgents.Application ──► SiesaAgents.Domain
///         │                                                ▲
///         └────► SiesaAgents.Infrastructure ───────────────┘
///
/// i.e. <c>SiesaAgents.Infrastructure</c> references ONLY <c>SiesaAgents.Domain</c>.
///
/// RED until the <c>&lt;ProjectReference Include="..\SiesaAgents.Application..." /&gt;</c>
/// line is removed from <c>SiesaAgents.Infrastructure.csproj</c> (Story Task 1).
/// </summary>
public class InfrastructureProjectReferenceTests
{
    private const string InfrastructureAssemblyName = "SiesaAgents.Infrastructure";
    private const string ApplicationAssemblyName = "SiesaAgents.Application";
    private const string DomainAssemblyName = "SiesaAgents.Domain";

    [Fact]
    public void Infrastructure_DoesNotReferenceApplication()
    {
        // GIVEN: the loaded SiesaAgents.Infrastructure assembly
        var infrastructure = LoadAssembly(InfrastructureAssemblyName);

        // WHEN: we enumerate its referenced assemblies
        var referenced = infrastructure
            .GetReferencedAssemblies()
            .Select(name => name.Name)
            .ToList();

        // THEN: SiesaAgents.Application MUST NOT appear in the reference graph (AC #7).
        Assert.DoesNotContain(ApplicationAssemblyName, referenced);
    }

    [Fact]
    public void Infrastructure_DoesReferenceDomain()
    {
        // GIVEN: the loaded SiesaAgents.Infrastructure assembly
        var infrastructure = LoadAssembly(InfrastructureAssemblyName);

        // WHEN: we enumerate its referenced assemblies
        var referenced = infrastructure
            .GetReferencedAssemblies()
            .Select(name => name.Name)
            .ToList();

        // THEN: SiesaAgents.Domain MUST be the (only) project reference per Clean Architecture.
        Assert.Contains(DomainAssemblyName, referenced);
    }

    private static Assembly LoadAssembly(string simpleName)
    {
        // Try the already-loaded set first (faster, avoids file IO).
        var loaded = AppDomain.CurrentDomain
            .GetAssemblies()
            .FirstOrDefault(a => string.Equals(a.GetName().Name, simpleName, StringComparison.Ordinal));
        if (loaded is not null) return loaded;

        // Fall back to an explicit Load (SiesaAgents.Infrastructure may not yet be touched
        // by other tests; the UnitTests project already has a ProjectReference to it so
        // it ships in the test output directory).
        return Assembly.Load(simpleName);
    }
}
