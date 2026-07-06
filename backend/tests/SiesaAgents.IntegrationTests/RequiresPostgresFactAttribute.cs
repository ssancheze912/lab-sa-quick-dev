using System.Net.Sockets;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// A <c>[Fact]</c> that xUnit reports as <c>Skipped</c> (not <c>Passed</c>) when PostgreSQL is
/// not reachable in the current environment.
///
/// Fixes a silent soft-skip anti-pattern found in code review of Story 1.3: test bodies that
/// just <c>return</c> early after a failed connectivity check are reported by xUnit as
/// "Passed" even though no assertion ever ran — a CI/local run with no PostgreSQL instance
/// looks identical (all green) to a run that genuinely verified AC #1/#3, masking the absence
/// of real validation. This attribute performs a plain TCP reachability probe synchronously at
/// test-discovery time (attribute construction, before the test body runs) and sets the
/// inherited <see cref="FactAttribute.Skip"/> reason when the probe fails, so the test runner
/// surfaces a distinct "Skipped" result instead of a false "Passed".
/// </summary>
public sealed class RequiresPostgresFactAttribute : FactAttribute
{
    private const string Host = "localhost";
    private const int Port = 5432;
    private static readonly TimeSpan ProbeTimeout = TimeSpan.FromSeconds(1);

    public RequiresPostgresFactAttribute()
    {
        if (!IsPortReachable(Host, Port, ProbeTimeout))
        {
            Skip = $"PostgreSQL is not reachable at {Host}:{Port} in this environment.";
        }
    }

    private static bool IsPortReachable(string host, int port, TimeSpan timeout)
    {
        try
        {
            using var client = new TcpClient();
            var connectTask = client.ConnectAsync(host, port);
            return connectTask.Wait(timeout) && client.Connected;
        }
        catch
        {
            return false;
        }
    }
}
