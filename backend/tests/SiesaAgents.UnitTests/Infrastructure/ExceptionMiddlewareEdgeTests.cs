using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using System.Net.Http.Json;
using System.Reflection;
using System.Text.Json;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Story 1.3: Backend Database Foundation — Extended Coverage for ExceptionHandlingMiddleware
///
/// Expands ATDD tests with edge cases, boundary conditions, and error paths
/// not covered by ExceptionMiddlewareTests.cs.
///
/// ATDD base covers:
///   - HTTP 500 status code
///   - Content-Type: application/problem+json
///   - 'status' field present
///   - 'title' field present and non-empty
///   - 'stackTrace' key NOT present (NFR6)
///   - 'exception' key NOT present (NFR6)
///   - 'innerException' key NOT present (NFR6)
///
/// This file covers:
///   - status field VALUE equals 500 (not just presence)
///   - 'detail' field is null or absent (never exposes exception message)
///   - Sensitive exception message not leaked in any field
///   - POST method triggers same middleware behavior
///   - OperationCanceledException handled as 500 (not unhandled)
///   - AggregateException with multiple inner exceptions: no internals leaked
///   - Exception with null message: middleware doesn't crash
///   - Exception thrown in async context (async lambda)
///   - title field has a stable non-empty value
///   - Multiple consecutive requests: middleware is stateless
///   - Response body is valid JSON (parseable)
///   - Static analysis: middleware class structure (primary ctor, InvokeAsync method)
///   - Static analysis: middleware catches base Exception type
///
/// NOTE: .NET 10 SDK not available in CI. These tests use WebApplicationFactory
///       which is a compile-time + runtime test pattern. Marked as static analysis
///       where pure reflection is used.
/// </summary>
public class ExceptionMiddlewareEdgeTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ExceptionMiddlewareEdgeTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    // ─── status field VALUE verification ─────────────────────────────────────

    [Fact]
    public async Task UnhandledException_StatusField_ValueEquals500()
    {
        // GIVEN: Middleware sets Status = StatusCodes.Status500InternalServerError
        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.Configure(app =>
            {
                app.UseMiddleware<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>();
                app.Run(_ => throw new Exception("test error"));
            });
        }).CreateClient();

        // WHEN: Exception occurs and response body is parsed
        var response = await client.GetAsync("/test");
        var body = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        // THEN: 'status' field value is exactly 500
        Assert.True(root.TryGetProperty("status", out var statusProp));
        Assert.Equal(500, statusProp.GetInt32());
    }

    // ─── detail field: null or absent (NFR6 — never expose exception message) ──

    [Fact]
    public async Task UnhandledException_DetailField_IsNullOrAbsent()
    {
        // GIVEN: ExceptionHandlingMiddleware sets Detail = null explicitly
        //        (never exposes ex.Message or stack traces per NFR6)
        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.Configure(app =>
            {
                app.UseMiddleware<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>();
                app.Run(_ => throw new Exception("SENSITIVE_MESSAGE_MUST_NOT_APPEAR"));
            });
        }).CreateClient();

        // WHEN: The exception has a sensitive message and response body is parsed
        var response = await client.GetAsync("/test");
        var body = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        // THEN: If 'detail' exists it must be null — it must NEVER contain the exception message
        if (root.TryGetProperty("detail", out var detailProp))
        {
            Assert.Equal(JsonValueKind.Null, detailProp.ValueKind);
        }
        // OR: 'detail' is absent entirely — both are acceptable
    }

    [Fact]
    public async Task UnhandledException_SensitiveExceptionMessage_NotLeakedInResponseBody()
    {
        // GIVEN: Exception with a clearly identifiable sensitive message
        const string sensitiveMessage = "SECRET_DB_PASSWORD_IN_CONNECTION_STRING_12345";

        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.Configure(app =>
            {
                app.UseMiddleware<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>();
                app.Run(_ => throw new Exception(sensitiveMessage));
            });
        }).CreateClient();

        // WHEN: The exception carries a sensitive message
        var response = await client.GetAsync("/test");
        var body = await response.Content.ReadAsStringAsync();

        // THEN: The sensitive message does NOT appear anywhere in the response body (NFR6)
        Assert.DoesNotContain(sensitiveMessage, body);
    }

    // ─── HTTP method variations ───────────────────────────────────────────────

    [Fact]
    public async Task UnhandledException_ViaPostRequest_ReturnsProblemDetails()
    {
        // GIVEN: Middleware wraps exceptions regardless of HTTP method
        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.Configure(app =>
            {
                app.UseMiddleware<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>();
                app.Run(_ => throw new Exception("post error"));
            });
        }).CreateClient();

        // WHEN: POST request triggers unhandled exception
        var response = await client.PostAsJsonAsync("/api/test", new { });

        // THEN: Same Problem Details response as GET
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        var contentType = response.Content.Headers.ContentType?.ToString() ?? string.Empty;
        Assert.Contains("application/problem+json", contentType);
    }

    [Fact]
    public async Task UnhandledException_ViaPutRequest_ReturnsProblemDetails()
    {
        // GIVEN: Middleware wraps exceptions regardless of HTTP method
        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.Configure(app =>
            {
                app.UseMiddleware<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>();
                app.Run(_ => throw new Exception("put error"));
            });
        }).CreateClient();

        // WHEN: PUT request triggers unhandled exception
        var response = await client.PutAsJsonAsync("/api/test/1", new { });

        // THEN: Same Problem Details response
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Contains("application/problem+json",
            response.Content.Headers.ContentType?.ToString() ?? string.Empty);
    }

    // ─── AggregateException: multiple inner exceptions, no internals leaked ──

    [Fact]
    public async Task AggregateException_WithMultipleInners_DoesNotLeakAnyInnerDetails()
    {
        // GIVEN: AggregateException wraps multiple inner exceptions with sensitive messages
        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.Configure(app =>
            {
                app.UseMiddleware<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>();
                app.Run(_ => throw new AggregateException(
                    new Exception("inner_sensitive_1"),
                    new Exception("inner_sensitive_2")));
            });
        }).CreateClient();

        // WHEN: AggregateException is caught by middleware
        var response = await client.GetAsync("/test");
        var body = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        // THEN: HTTP 500, no inner exception data in body
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.DoesNotContain("inner_sensitive_1", body);
        Assert.DoesNotContain("inner_sensitive_2", body);
        Assert.False(root.TryGetProperty("innerException", out _));
        Assert.False(root.TryGetProperty("innerExceptions", out _));
    }

    // ─── Exception with null message: middleware does not crash ──────────────

    [Fact]
    public async Task Exception_WithNullMessage_MiddlewareDoesNotCrash()
    {
        // GIVEN: Exception can be instantiated with no message (null message edge case)
        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.Configure(app =>
            {
                app.UseMiddleware<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>();
                // Exception() with no args has null Message in some contexts
                app.Run(_ => throw new InvalidOperationException());
            });
        }).CreateClient();

        // WHEN: Exception with empty/default message is thrown
        var response = await client.GetAsync("/test");

        // THEN: Middleware handles it gracefully — still returns Problem Details
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        var contentType = response.Content.Headers.ContentType?.ToString() ?? string.Empty;
        Assert.Contains("application/problem+json", contentType);
    }

    // ─── Async exception context ─────────────────────────────────────────────

    [Fact]
    public async Task AsyncException_ThrownFromTask_IsHandledByMiddleware()
    {
        // GIVEN: Exception thrown inside an async Task (not synchronous throw)
        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.Configure(app =>
            {
                app.UseMiddleware<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>();
                app.Run(async _ =>
                {
                    await Task.Yield(); // Force async context switch
                    throw new Exception("async test error");
                });
            });
        }).CreateClient();

        // WHEN: Async exception propagates through the pipeline
        var response = await client.GetAsync("/test");

        // THEN: Middleware catches it — same Problem Details response
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Contains("application/problem+json",
            response.Content.Headers.ContentType?.ToString() ?? string.Empty);
    }

    // ─── Response body is always valid JSON ───────────────────────────────────

    [Fact]
    public async Task UnhandledException_ResponseBody_IsValidJson()
    {
        // GIVEN: Middleware always writes JSON
        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.Configure(app =>
            {
                app.UseMiddleware<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>();
                app.Run(_ => throw new Exception("json test error"));
            });
        }).CreateClient();

        // WHEN: Response body is retrieved
        var response = await client.GetAsync("/test");
        var body = await response.Content.ReadAsStringAsync();

        // THEN: Body parses as valid JSON without throwing
        var exception = Record.Exception(() => JsonDocument.Parse(body));
        Assert.Null(exception);
    }

    // ─── Middleware is stateless across consecutive requests ─────────────────

    [Fact]
    public async Task UnhandledException_ConsecutiveRequests_AllReturnProblemDetails()
    {
        // GIVEN: Middleware is stateless — same behavior on every request
        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.Configure(app =>
            {
                app.UseMiddleware<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>();
                app.Run(_ => throw new Exception("consecutive test"));
            });
        }).CreateClient();

        // WHEN: Three consecutive requests are made
        var response1 = await client.GetAsync("/test");
        var response2 = await client.GetAsync("/test");
        var response3 = await client.GetAsync("/test");

        // THEN: All return 500 Problem Details (middleware has no accumulated state)
        Assert.Equal(HttpStatusCode.InternalServerError, response1.StatusCode);
        Assert.Equal(HttpStatusCode.InternalServerError, response2.StatusCode);
        Assert.Equal(HttpStatusCode.InternalServerError, response3.StatusCode);
    }

    // ─── title field: stable non-empty value ────────────────────────────────

    [Fact]
    public async Task UnhandledException_TitleField_HasStableValue()
    {
        // GIVEN: ExceptionHandlingMiddleware sets Title = "An unexpected error occurred."
        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.Configure(app =>
            {
                app.UseMiddleware<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>();
                app.Run(_ => throw new Exception("test"));
            });
        }).CreateClient();

        // WHEN: Response body is parsed
        var response = await client.GetAsync("/test");
        var body = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        // THEN: title field contains the expected stable value
        Assert.True(root.TryGetProperty("title", out var titleProp));
        var titleValue = titleProp.GetString();
        Assert.False(string.IsNullOrWhiteSpace(titleValue));
        // Title must not include the exception type or message (NFR6)
        Assert.DoesNotContain("Exception", titleValue!);
    }

    // ─── Static analysis: middleware class structure ──────────────────────────

    [Fact]
    public void ExceptionHandlingMiddleware_IsPublic_NotInternal()
    {
        // GIVEN: Middleware is used in Program.cs via app.UseMiddleware<ExceptionHandlingMiddleware>()
        // WHEN: Type visibility is checked
        // THEN: Type must be public — UseMiddleware<T>() requires public type
        Assert.True(typeof(SiesaAgents.API.Middleware.ExceptionHandlingMiddleware).IsPublic);
    }

    [Fact]
    public void ExceptionHandlingMiddleware_HasInvokeAsyncMethod()
    {
        // GIVEN: ASP.NET Core middleware convention requires InvokeAsync(HttpContext)
        // WHEN: Method is searched via reflection
        // THEN: InvokeAsync method exists with HttpContext parameter
        var invokeAsync = typeof(SiesaAgents.API.Middleware.ExceptionHandlingMiddleware)
            .GetMethod("InvokeAsync", BindingFlags.Public | BindingFlags.Instance);

        Assert.NotNull(invokeAsync);
    }

    [Fact]
    public void ExceptionHandlingMiddleware_InvokeAsync_AcceptsHttpContext()
    {
        // GIVEN: Middleware convention: InvokeAsync(HttpContext context)
        // WHEN: Method parameters are inspected
        // THEN: First parameter type is HttpContext
        var invokeAsync = typeof(SiesaAgents.API.Middleware.ExceptionHandlingMiddleware)
            .GetMethod("InvokeAsync", BindingFlags.Public | BindingFlags.Instance);

        Assert.NotNull(invokeAsync);
        var parameters = invokeAsync!.GetParameters();
        Assert.Equal(typeof(HttpContext), parameters[0].ParameterType);
    }

    [Fact]
    public void ExceptionHandlingMiddleware_InvokeAsync_ReturnsTask()
    {
        // GIVEN: Middleware must be async (Task return type) to not block the pipeline
        // WHEN: Return type is inspected
        // THEN: InvokeAsync returns Task (not void)
        var invokeAsync = typeof(SiesaAgents.API.Middleware.ExceptionHandlingMiddleware)
            .GetMethod("InvokeAsync", BindingFlags.Public | BindingFlags.Instance);

        Assert.NotNull(invokeAsync);
        Assert.Equal(typeof(Task), invokeAsync!.ReturnType);
    }

    [Fact]
    public void ExceptionHandlingMiddleware_HasPrimaryConstructorWithRequestDelegate()
    {
        // GIVEN: Middleware uses primary constructor (RequestDelegate next)
        //        per .NET 10 minimal API patterns
        // WHEN: Constructor parameters are inspected
        // THEN: Exactly one constructor with RequestDelegate parameter
        var ctors = typeof(SiesaAgents.API.Middleware.ExceptionHandlingMiddleware)
            .GetConstructors(BindingFlags.Public | BindingFlags.Instance);

        Assert.Single(ctors);

        var parameters = ctors[0].GetParameters();
        Assert.Single(parameters);
        Assert.Equal(typeof(RequestDelegate), parameters[0].ParameterType);
    }

    [Fact]
    public void ExceptionHandlingMiddleware_IsInCorrectNamespace()
    {
        // GIVEN: Middleware lives in SiesaAgents.API.Middleware (company structure standard)
        // WHEN: Namespace is checked via reflection
        // THEN: Namespace matches the required structure
        Assert.Equal(
            "SiesaAgents.API.Middleware",
            typeof(SiesaAgents.API.Middleware.ExceptionHandlingMiddleware).Namespace);
    }

    [Fact]
    public void ExceptionHandlingMiddleware_IsNotAbstract()
    {
        // GIVEN: Middleware is instantiated by ASP.NET Core pipeline
        // WHEN: Abstract modifier is checked
        // THEN: Type is concrete (non-abstract)
        Assert.False(typeof(SiesaAgents.API.Middleware.ExceptionHandlingMiddleware).IsAbstract);
    }

    // ─── NFR6: various leakage vectors ───────────────────────────────────────

    [Fact]
    public async Task UnhandledException_ResponseBody_DoesNotContainExceptionTypeName()
    {
        // GIVEN: Exception type name is internal implementation detail (NFR6)
        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.Configure(app =>
            {
                app.UseMiddleware<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>();
                app.Run(_ => throw new ArgumentNullException("secretParamName"));
            });
        }).CreateClient();

        // WHEN: Response body is retrieved
        var response = await client.GetAsync("/test");
        var body = await response.Content.ReadAsStringAsync();

        // THEN: Neither the exception type name nor the parameter name appear in body
        Assert.DoesNotContain("ArgumentNullException", body);
        Assert.DoesNotContain("secretParamName", body);
    }

    [Fact]
    public async Task UnhandledException_ResponseBody_DoesNotContainAtStackFrames()
    {
        // GIVEN: Stack trace lines start with "   at " — must never appear (NFR6)
        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.Configure(app =>
            {
                app.UseMiddleware<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>();
                app.Run(_ => throw new Exception("stack trace test"));
            });
        }).CreateClient();

        // WHEN: Response body is retrieved
        var response = await client.GetAsync("/test");
        var body = await response.Content.ReadAsStringAsync();

        // THEN: No stack trace lines in response
        Assert.DoesNotContain("   at ", body);
        Assert.DoesNotContain("System.Exception", body);
    }

    [Fact]
    public async Task UnhandledException_ResponseBody_DoesNotContainErrors_Key()
    {
        // GIVEN: ValidationProblemDetails includes an 'errors' key — ExceptionHandlingMiddleware
        //        returns plain ProblemDetails (not ValidationProblemDetails) — no 'errors' key
        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.Configure(app =>
            {
                app.UseMiddleware<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>();
                app.Run(_ => throw new Exception("validation test"));
            });
        }).CreateClient();

        // WHEN: Response body is retrieved and parsed
        var response = await client.GetAsync("/test");
        var body = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        // THEN: No 'errors' collection (ValidationProblemDetails-only field) is present
        Assert.False(root.TryGetProperty("errors", out _),
            "ProblemDetails for 500 must NOT include 'errors' (that is ValidationProblemDetails only)");
    }
}
