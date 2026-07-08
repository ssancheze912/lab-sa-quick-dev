using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Hosting;
using SiesaAgents.API.Middleware;
using SiesaAgents.Domain.Clientes.Exceptions;

namespace SiesaAgents.UnitTests.Middleware;

/// <summary>
/// Story 2.3 — ATDD (RED phase).
///
/// Verifies that <see cref="ExceptionHandlingMiddleware"/>'s new branch (Task 4)
/// translates <see cref="ClienteNitConflictException"/> into an HTTP 409 with a
/// Problem Details RFC 7807 body carrying the Spanish detail
/// <c>"El NIT/RUC ya está registrado"</c>. Asserts NFR6/R-001 anti-leak: no
/// <c>stackTrace</c>, <c>exception</c>, or developer-facing message ever
/// reaches the response body.
///
/// RED until:
///   - ClienteNitConflictException exists in SiesaAgents.Domain.Clientes.Exceptions
///   - ExceptionHandlingMiddleware gains a catch branch for that exception
/// </summary>
public sealed class ExceptionHandlingMiddleware_NitConflictTests
{
    [Fact]
    public async Task Middleware_Translates_ClienteNitConflictException_To_409_ProblemDetails()
    {
        using var host = await new HostBuilder()
            .ConfigureWebHost(webBuilder =>
            {
                webBuilder
                    .UseTestServer()
                    .Configure(app =>
                    {
                        app.UseMiddleware<ExceptionHandlingMiddleware>();
                        app.Run(_ => throw new ClienteNitConflictException("900123456"));
                    });
            })
            .StartAsync();

        var client = host.GetTestClient();
        var response = await client.GetAsync("/anything");

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
        Assert.StartsWith("application/problem+json", contentType);

        var raw = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(raw);
        Assert.Equal("Conflict", doc.RootElement.GetProperty("title").GetString());
        Assert.Equal(409, doc.RootElement.GetProperty("status").GetInt32());
        Assert.Equal("El NIT/RUC ya está registrado", doc.RootElement.GetProperty("detail").GetString());

        // NFR6 / R-001 — no leaks.
        Assert.DoesNotContain("stackTrace", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("exception", raw, StringComparison.OrdinalIgnoreCase);
        // Developer-facing exception message sentinel.
        Assert.DoesNotContain("NIT '", raw);
        Assert.DoesNotContain("already exists", raw, StringComparison.OrdinalIgnoreCase);
    }
}
