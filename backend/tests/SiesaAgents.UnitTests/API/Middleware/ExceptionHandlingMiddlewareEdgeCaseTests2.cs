using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SiesaAgents.API.Middleware;

namespace SiesaAgents.UnitTests.API.Middleware;

/// <summary>
/// Edge-case and boundary unit tests for ExceptionHandlingMiddleware — Part 2.
/// Story 1.3: Backend Database Foundation — extended coverage beyond ATDD baseline.
///
/// Covers:
///   - Multiple sequential requests through the same middleware instance
///   - Exception thrown synchronously vs. from async delegate
///   - Title field values per mapped exception type
/// </summary>
public class ExceptionHandlingMiddlewareEdgeCaseTests2
{
    // -------------------------------------------------------------------------
    // Helper: Build a default HttpContext with a writable response body stream
    // -------------------------------------------------------------------------
    private static DefaultHttpContext CreateHttpContext()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        return context;
    }

    private static async Task<ProblemDetails?> ReadProblemDetailsAsync(HttpResponse response)
    {
        response.Body.Seek(0, SeekOrigin.Begin);
        var json = await new StreamReader(response.Body).ReadToEndAsync();
        return JsonSerializer.Deserialize<ProblemDetails>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });
    }

    // =========================================================================
    // Multiple sequential requests — middleware is stateless (reusable instance)
    // =========================================================================

    [Fact]
    public async Task InvokeAsync_MultipleSequentialRequests_EachProducesCorrectResponse()
    {
        // GIVEN: Three separate middleware instances with different next delegates
        //        First: KeyNotFoundException → 404
        //        Second: ArgumentException → 400
        //        Third: success → 200
        DefaultHttpContext ctx1 = CreateHttpContext();
        DefaultHttpContext ctx2 = CreateHttpContext();
        DefaultHttpContext ctx3 = CreateHttpContext();

        var mw1 = new ExceptionHandlingMiddleware(next: _ => throw new KeyNotFoundException("not found"));
        var mw2 = new ExceptionHandlingMiddleware(next: _ => throw new ArgumentException("bad input"));
        var mw3 = new ExceptionHandlingMiddleware(next: ctx =>
        {
            ctx.Response.StatusCode = StatusCodes.Status200OK;
            return Task.CompletedTask;
        });

        // WHEN: Three sequential requests with different outcomes
        await mw1.InvokeAsync(ctx1);
        await mw2.InvokeAsync(ctx2);
        await mw3.InvokeAsync(ctx3);

        // THEN: Each request produces its own correct, isolated response
        Assert.Equal(StatusCodes.Status404NotFound, ctx1.Response.StatusCode);
        Assert.Equal(StatusCodes.Status400BadRequest, ctx2.Response.StatusCode);
        Assert.Equal(StatusCodes.Status200OK, ctx3.Response.StatusCode);
    }

    // =========================================================================
    // Async exception path — exception from async delegate is caught
    // =========================================================================

    [Fact]
    public async Task InvokeAsync_AsyncDelegateThatThrows_Returns409()
    {
        // GIVEN: An asynchronous next delegate that throws after an await
        var middleware = new ExceptionHandlingMiddleware(
            next: async _ =>
            {
                await Task.Yield(); // Simulate async work
                throw new InvalidOperationException("Async conflict");
            }
        );
        var context = CreateHttpContext();

        // WHEN: Request is processed through the async throwing delegate
        await middleware.InvokeAsync(context);

        // THEN: The exception is caught and mapped to 409
        Assert.Equal(StatusCodes.Status409Conflict, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_AsyncDelegateThatThrows_ContentTypeIsProblemJson()
    {
        // GIVEN: An asynchronous next delegate that throws after an await
        var middleware = new ExceptionHandlingMiddleware(
            next: async _ =>
            {
                await Task.Yield();
                throw new InvalidOperationException("Async conflict");
            }
        );
        var context = CreateHttpContext();

        // WHEN: Request is processed
        await middleware.InvokeAsync(context);

        // THEN: Content-Type is application/problem+json for the async exception path
        Assert.Equal("application/problem+json", context.Response.ContentType);
    }

    // =========================================================================
    // Title field values — correct title per mapped exception
    // =========================================================================

    [Fact]
    public async Task InvokeAsync_KeyNotFoundException_TitleIsResourceNotFound()
    {
        // GIVEN: KeyNotFoundException thrown downstream
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new KeyNotFoundException("Entity missing")
        );
        var context = CreateHttpContext();

        // WHEN: Request is processed
        await middleware.InvokeAsync(context);

        // THEN: Title is "Resource not found" (company-standard error title)
        var problem = await ReadProblemDetailsAsync(context.Response);
        Assert.NotNull(problem);
        Assert.Equal("Resource not found", problem.Title);
    }

    [Fact]
    public async Task InvokeAsync_ArgumentException_TitleIsBadRequest()
    {
        // GIVEN: ArgumentException thrown downstream
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new ArgumentException("Invalid parameter")
        );
        var context = CreateHttpContext();

        // WHEN: Request is processed
        await middleware.InvokeAsync(context);

        // THEN: Title is "Bad request"
        var problem = await ReadProblemDetailsAsync(context.Response);
        Assert.NotNull(problem);
        Assert.Equal("Bad request", problem.Title);
    }

    [Fact]
    public async Task InvokeAsync_InvalidOperationException_TitleIsConflict()
    {
        // GIVEN: InvalidOperationException thrown downstream
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new InvalidOperationException("State conflict")
        );
        var context = CreateHttpContext();

        // WHEN: Request is processed
        await middleware.InvokeAsync(context);

        // THEN: Title is "Conflict"
        var problem = await ReadProblemDetailsAsync(context.Response);
        Assert.NotNull(problem);
        Assert.Equal("Conflict", problem.Title);
    }

    [Fact]
    public async Task InvokeAsync_GenericException_TitleIsUnexpectedError()
    {
        // GIVEN: A generic Exception thrown downstream
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new Exception("Generic failure")
        );
        var context = CreateHttpContext();

        // WHEN: Request is processed
        await middleware.InvokeAsync(context);

        // THEN: Title is "An unexpected error occurred"
        var problem = await ReadProblemDetailsAsync(context.Response);
        Assert.NotNull(problem);
        Assert.Equal("An unexpected error occurred", problem.Title);
    }
}
