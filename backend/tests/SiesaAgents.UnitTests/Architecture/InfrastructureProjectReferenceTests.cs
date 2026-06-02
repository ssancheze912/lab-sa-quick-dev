using System.Xml.Linq;
using Xunit;

namespace SiesaAgents.UnitTests.Architecture;

/// <summary>
/// Architecture guard for Story 1.3 AC #7.
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
/// AC #7 verifies "project references are audited" — we parse the actual csproj
/// rather than relying on runtime <c>GetReferencedAssemblies()</c>, which the
/// compiler trims when no symbol is consumed (Domain is empty until Epic 2).
/// </summary>
public class InfrastructureProjectReferenceTests
{
    private static XDocument LoadInfrastructureCsproj()
    {
        // Test binaries live at tests/SiesaAgents.UnitTests/bin/Debug/net10.0/.
        // Walk up to the backend root, then descend to the infrastructure csproj.
        var assemblyLocation = typeof(InfrastructureProjectReferenceTests).Assembly.Location;
        var dir = new DirectoryInfo(Path.GetDirectoryName(assemblyLocation)!);
        while (dir is not null && !File.Exists(Path.Combine(dir.FullName, "SiesaAgents.slnx")))
        {
            dir = dir.Parent;
        }

        Assert.NotNull(dir);
        var csprojPath = Path.Combine(
            dir!.FullName,
            "src",
            "SiesaAgents.Infrastructure",
            "SiesaAgents.Infrastructure.csproj");
        Assert.True(File.Exists(csprojPath), $"Expected csproj at {csprojPath}");

        return XDocument.Load(csprojPath);
    }

    private static List<string> GetProjectReferences(XDocument csproj) =>
        csproj.Descendants("ProjectReference")
            .Select(pr => pr.Attribute("Include")?.Value ?? string.Empty)
            // Normalize Windows-style separators so Path.GetFileNameWithoutExtension
            // works regardless of OS the tests run on.
            .Select(include => include.Replace('\\', '/'))
            .Select(Path.GetFileNameWithoutExtension)
            .Where(name => !string.IsNullOrEmpty(name))
            .Select(name => name!)
            .ToList();

    [Fact]
    public void Infrastructure_DoesNotReferenceApplication()
    {
        // GIVEN: the Infrastructure project file
        var csproj = LoadInfrastructureCsproj();

        // WHEN: we enumerate its <ProjectReference Include="..." /> entries
        var projectReferences = GetProjectReferences(csproj);

        // THEN: SiesaAgents.Application MUST NOT appear (AC #7).
        Assert.DoesNotContain("SiesaAgents.Application", projectReferences);
    }

    [Fact]
    public void Infrastructure_DoesReferenceDomain()
    {
        // GIVEN: the Infrastructure project file
        var csproj = LoadInfrastructureCsproj();

        // WHEN: we enumerate its <ProjectReference Include="..." /> entries
        var projectReferences = GetProjectReferences(csproj);

        // THEN: SiesaAgents.Domain MUST be the (only) project reference per Clean Architecture (AC #7).
        Assert.Contains("SiesaAgents.Domain", projectReferences);
    }
}
