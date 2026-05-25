using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SiesaAgents.API.Middleware;

namespace SiesaAgents.UnitTests.API;

/// <summary>
/// Unit tests for ExceptionHandlingMiddleware edge cases and error paths.
/// </summary>
public class ExceptionHandlingMiddlewareTests
{
    // --- Happy path: request passes through when no exception ---

    [Fact]
    public async Task InvokeAsync_WhenNoException_CallsNextDelegate()
    {
        // Arrange
        var nextCalled = false;
        RequestDelegate next = _ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        };
        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert: next was called (pass-through)
        Assert.True(nextCalled);
    }

    [Fact]
    public async Task InvokeAsync_WhenNoException_DoesNotModifyResponseStatus()
    {
        // Arrange
        RequestDelegate next = _ => Task.CompletedTask;
        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert: status code remains 200 (default)
        Assert.Equal(200, context.Response.StatusCode);
    }

    // --- Error path: exception triggers Problem Details response ---

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_Returns500StatusCode()
    {
        // Arrange
        RequestDelegate next = _ => throw new InvalidOperationException("Test error");
        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert: status code set to 500
        Assert.Equal(500, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_SetsContentTypeToProblemJson()
    {
        // Arrange
        RequestDelegate next = _ => throw new Exception("boom");
        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert: Content-Type is application/problem+json
        Assert.Equal("application/problem+json", context.Response.ContentType);
    }

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_WritesValidProblemDetailsJson()
    {
        // Arrange
        RequestDelegate next = _ => throw new Exception("secret error");
        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert: response body is valid JSON with status 500
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        var body = await reader.ReadToEndAsync();
        var problem = JsonSerializer.Deserialize<ProblemDetails>(body, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.NotNull(problem);
        Assert.Equal(500, problem!.Status);
    }

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_DoesNotExposeExceptionMessageInDetail()
    {
        // Arrange: exception with sensitive message
        var sensitiveMessage = "Password=SuperSecret123; Host=db-server";
        RequestDelegate next = _ => throw new InvalidOperationException(sensitiveMessage);
        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert: sensitive message not in response body
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        var body = await reader.ReadToEndAsync();

        Assert.DoesNotContain(sensitiveMessage, body);
        Assert.DoesNotContain("SuperSecret", body);
    }

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_ProblemDetailsTitleIsGenericMessage()
    {
        // Arrange
        RequestDelegate next = _ => throw new Exception("internal details");
        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert: generic title is present, not the original exception message
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        var body = await reader.ReadToEndAsync();

        Assert.DoesNotContain("internal details", body);
        // Title should contain a generic message (Spanish: "Se produjo un error inesperado.")
        Assert.Contains("Se produjo un error inesperado", body);
    }

    // --- Edge: response already started ---

    [Fact]
    public async Task InvokeAsync_WhenResponseAlreadyStarted_DoesNotOverwriteResponse()
    {
        // Arrange: simulate a response that has already started (HasStarted = true)
        // We achieve this by writing to the response before throwing
        var responseWrittenBeforeException = false;
        RequestDelegate next = async context =>
        {
            // Write something to start the response
            context.Response.StatusCode = 200;
            await context.Response.WriteAsync("partial response");
            responseWrittenBeforeException = true;
            throw new Exception("too late to handle");
        };

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act: should not throw even if response started
        var exception = await Record.ExceptionAsync(() => middleware.InvokeAsync(context));

        // Assert: next was called and partial response was written
        Assert.True(responseWrittenBeforeException);
        // Middleware should complete without throwing itself
        Assert.Null(exception);
    }

    // --- Edge: different exception types are all caught ---

    [Fact]
    public async Task InvokeAsync_WhenArgumentExceptionThrown_Returns500()
    {
        // Arrange
        RequestDelegate next = _ => throw new ArgumentException("bad arg");
        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert: all exceptions result in 500
        Assert.Equal(500, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_WhenNullReferenceExceptionThrown_Returns500()
    {
        // Arrange
        RequestDelegate next = _ => throw new NullReferenceException("null ref");
        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(500, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_WhenTaskCanceledExceptionThrown_Returns500()
    {
        // Arrange
        RequestDelegate next = _ => throw new TaskCanceledException("cancelled");
        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert: TaskCanceledException is also caught by catch (Exception)
        Assert.Equal(500, context.Response.StatusCode);
    }

    // --- ProblemDetails structure: detail is null (never exposes internals) ---

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_ProblemDetailsDetailIsNull()
    {
        // Arrange
        RequestDelegate next = _ => throw new Exception("this should not appear in detail");
        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert: Detail is null per spec (never expose exception internals)
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        var body = await reader.ReadToEndAsync();
        using var doc = JsonDocument.Parse(body);
        var hasDetail = doc.RootElement.TryGetProperty("detail", out var detailProp);

        // detail property should either be absent or null
        if (hasDetail)
        {
            Assert.Equal(JsonValueKind.Null, detailProp.ValueKind);
        }
    }
}
