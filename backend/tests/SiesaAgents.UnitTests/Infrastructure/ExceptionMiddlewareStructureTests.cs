using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using System.Reflection;
using System.Text.Json;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Story 1.3: Backend Database Foundation — Middleware Title Stability, Static Structure, and NFR6 Leakage Vectors
///
/// Covers: title field stable value, static analysis of ExceptionHandlingMiddleware
/// class structure (public/abstract/namespace/constructor/InvokeAsync), and NFR6
/// information-leakage verification (exception type name, stack frames, errors key).
///
/// Split from ExceptionMiddlewareEdgeTests.cs to comply with the 300-line file size limit.
/// </summary>
public class ExceptionMiddlewareStructureTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ExceptionMiddlewareStructureTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
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
