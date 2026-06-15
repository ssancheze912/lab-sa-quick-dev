namespace SiesaAgents.UnitTests;

/// <summary>
/// Smoke test asserting the xUnit test harness is wired correctly.
/// Story 1.1 has no domain logic to test — this exists so future stories can
/// rely on a working test framework without re-bootstrapping it.
/// </summary>
public class SmokeTests
{
    [Fact]
    public void TestFramework_IsWiredCorrectly()
    {
        Assert.True(true);
    }
}
