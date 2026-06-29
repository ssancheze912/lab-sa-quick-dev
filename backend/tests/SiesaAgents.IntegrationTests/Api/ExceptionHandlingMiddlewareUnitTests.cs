using System.Net;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using SiesaAgents.API.Middleware;

namespace SiesaAgents.IntegrationTests.Api;

/// <summary>
/// Direct unit tests for <see cref="ExceptionHandlingMiddleware"/> — exercises every branch
/// without an HTTP host. Complements the ATDD <c>ProblemDetailsTests</c> which only cover
/// the happy unhandled-exception flow via WebApplicationFactory.
/// </summary>
public class ExceptionHandlingMiddlewareUnitTests
{
    [Fact]
    public async Task InvokeAsync_NoExceptionThrown_PassesThroughWithoutTouchingResponse()
    {
        // GIVEN: a next-delegate that completes normally and a default response (status 200).
        var nextInvoked = false;
        RequestDelegate next = ctx =>
        {
            nextInvoked = true;
            return Task.CompletedTask;
        };
        var middleware = new ExceptionHandlingMiddleware(next, NullLogger<ExceptionHandlingMiddleware>.Instance);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: the middleware is invoked.
        await middleware.InvokeAsync(context);

        // THEN: the next delegate ran and the response was not overwritten.
        nextInvoked.Should().BeTrue("the next delegate must run when no exception is thrown");
        context.Response.StatusCode.Should().Be((int)HttpStatusCode.OK, "no exception => default 200");
        context.Response.ContentType.Should().BeNull("middleware must not set ContentType on success");
    }

    [Fact]
    public async Task InvokeAsync_ExceptionThrown_Sets500AndProblemJsonContentType()
    {
        // GIVEN: a next-delegate that throws.
        RequestDelegate next = _ => throw new InvalidOperationException("boom");
        var middleware = new ExceptionHandlingMiddleware(next, NullLogger<ExceptionHandlingMiddleware>.Instance);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        context.Request.Path = "/api/v1/anything";

        // WHEN: the middleware is invoked.
        await middleware.InvokeAsync(context);

        // THEN: the response is shaped as Problem Details (RFC 7807).
        context.Response.StatusCode.Should().Be(StatusCodes.Status500InternalServerError);
        context.Response.ContentType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task InvokeAsync_ExceptionThrown_BodyContainsRequestPathAsInstanceAndOmitsLeakage()
    {
        // GIVEN: a request to a specific path that throws.
        RequestDelegate next = _ => throw new InvalidOperationException("leak-me-if-you-can");
        var middleware = new ExceptionHandlingMiddleware(next, NullLogger<ExceptionHandlingMiddleware>.Instance);
        var context = new DefaultHttpContext();
        var bodyStream = new MemoryStream();
        context.Response.Body = bodyStream;
        context.Request.Path = "/api/v1/some/resource";

        // WHEN: the middleware is invoked.
        await middleware.InvokeAsync(context);

        // THEN: the body uses the request path as Instance, sets Detail=null, and never leaks the message.
        bodyStream.Position = 0;
        using var doc = await JsonDocument.ParseAsync(bodyStream);
        var root = doc.RootElement;
        root.GetProperty("status").GetInt32().Should().Be(500);
        root.GetProperty("title").GetString().Should().NotBeNullOrWhiteSpace();
        root.GetProperty("type").GetString().Should().NotBeNullOrWhiteSpace();
        root.GetProperty("instance").GetString().Should().Be("/api/v1/some/resource");
        // Detail is serialized as null (DefaultIgnoreCondition is not WhenWritingNull by default in WriteAsJsonAsync).
        root.TryGetProperty("detail", out var detailProp).Should().BeTrue();
        (detailProp.ValueKind == JsonValueKind.Null).Should().BeTrue("Detail must be null per NFR6");

        bodyStream.Position = 0;
        var raw = await new StreamReader(bodyStream).ReadToEndAsync();
        raw.Should().NotContain("leak-me-if-you-can", "the exception Message MUST never reach the client");
        raw.Should().NotContain("StackTrace");
        raw.Should().NotContain("stackTrace");
    }

    [Fact]
    public async Task InvokeAsync_ResponseAlreadyStarted_RethrowsToHostInsteadOfWriting()
    {
        // GIVEN: a response whose body has already been "started" (HasStarted=true via a started feature).
        // We use a custom HttpResponseFeature to simulate HasStarted.
        RequestDelegate next = _ => throw new InvalidOperationException("late");
        var middleware = new ExceptionHandlingMiddleware(next, NullLogger<ExceptionHandlingMiddleware>.Instance);
        var context = new DefaultHttpContext();
        context.Features.Set<Microsoft.AspNetCore.Http.Features.IHttpResponseFeature>(new StartedHttpResponseFeature());
        context.Response.Body = new MemoryStream();

        // WHEN/THEN: middleware re-throws because it cannot rewrite an already-started response.
        Func<Task> act = () => middleware.InvokeAsync(context);
        await act.Should().ThrowAsync<InvalidOperationException>("the middleware must rethrow if HasStarted is true");
    }

    [Fact]
    public async Task InvokeAsync_DifferentHttpMethods_AllProduceProblemDetails()
    {
        // GIVEN: a middleware that always throws regardless of HTTP verb.
        foreach (var method in new[] { "GET", "POST", "PUT", "DELETE", "PATCH" })
        {
            RequestDelegate next = _ => throw new InvalidOperationException();
            var middleware = new ExceptionHandlingMiddleware(next, NullLogger<ExceptionHandlingMiddleware>.Instance);
            var context = new DefaultHttpContext();
            context.Request.Method = method;
            context.Request.Path = "/api/v1/x";
            context.Response.Body = new MemoryStream();

            // WHEN: invoked.
            await middleware.InvokeAsync(context);

            // THEN: response is always Problem Details with 500.
            context.Response.StatusCode.Should().Be(500, $"verb {method} must still go through the middleware");
            context.Response.ContentType.Should().Be("application/problem+json");
        }
    }

    /// <summary>
    /// HttpResponseFeature stand-in that reports HasStarted=true and rejects writes.
    /// </summary>
    private sealed class StartedHttpResponseFeature : Microsoft.AspNetCore.Http.Features.IHttpResponseFeature
    {
        public int StatusCode { get; set; } = 200;
        public string? ReasonPhrase { get; set; }
        public IHeaderDictionary Headers { get; set; } = new HeaderDictionary();
        public Stream Body { get; set; } = new MemoryStream();
        public bool HasStarted => true;
        public void OnStarting(Func<object, Task> callback, object state) { }
        public void OnCompleted(Func<object, Task> callback, object state) { }
    }
}
