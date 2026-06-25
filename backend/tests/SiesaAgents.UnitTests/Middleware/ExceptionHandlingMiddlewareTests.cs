using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.API.Middleware;
using Xunit;

namespace SiesaAgents.UnitTests.Middleware;

/// <summary>
/// ATDD Tests for Story 1.3 — AC #2
/// ExceptionHandlingMiddleware must return Problem Details RFC 7807 format
/// for any unhandled exception without exposing stack traces or exception messages.
/// Tests are in RED phase — they define expected behavior BEFORE implementation is finalized.
/// </summary>
public class ExceptionHandlingMiddlewareTests
{
    // -------------------------------------------------------------------------
    // AC #2: Unhandled exception → Problem Details RFC 7807 response
    // -------------------------------------------------------------------------

    [Fact]
    public async Task GivenUnhandledException_WhenErrorPropagates_ThenResponseStatusIs500()
    {
        // GIVEN: A minimal ASP.NET Core app with ExceptionHandlingMiddleware registered
        //        that throws an unhandled exception in the next middleware
        var builder = WebApplication.CreateBuilder([]);
        builder.WebHost.UseTestServer();
        var app = builder.Build();

        app.UseMiddleware<ExceptionHandlingMiddleware>();
        app.MapGet("/throw", () => { throw new InvalidOperationException("secret error"); });

        await app.StartAsync();

        using var client = app.GetTestClient();

        // WHEN: The request triggers the unhandled exception
        var response = await client.GetAsync("/throw");

        // THEN: Response status code is 500 Internal Server Error
        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
    }

    [Fact]
    public async Task GivenUnhandledException_WhenErrorPropagates_ThenContentTypeIsProblemJson()
    {
        // GIVEN: A minimal ASP.NET Core app with ExceptionHandlingMiddleware
        var builder = WebApplication.CreateBuilder([]);
        builder.WebHost.UseTestServer();
        var app = builder.Build();

        app.UseMiddleware<ExceptionHandlingMiddleware>();
        app.MapGet("/throw", () => { throw new InvalidOperationException("secret error"); });

        await app.StartAsync();

        using var client = app.GetTestClient();

        // WHEN: The request triggers the unhandled exception
        var response = await client.GetAsync("/throw");

        // THEN: Content-Type is application/problem+json (RFC 7807 mandate)
        response.Content.Headers.ContentType?.MediaType
            .Should().Be("application/problem+json");
    }

    [Fact]
    public async Task GivenUnhandledException_WhenErrorPropagates_ThenBodyContainsStatusField()
    {
        // GIVEN: A minimal ASP.NET Core app with ExceptionHandlingMiddleware
        var builder = WebApplication.CreateBuilder([]);
        builder.WebHost.UseTestServer();
        var app = builder.Build();

        app.UseMiddleware<ExceptionHandlingMiddleware>();
        app.MapGet("/throw", () => { throw new InvalidOperationException("secret error"); });

        await app.StartAsync();

        using var client = app.GetTestClient();

        // WHEN: The request triggers the unhandled exception
        var response = await client.GetAsync("/throw");
        var problemDetails = await response.Content.ReadFromJsonAsync<ProblemDetails>();

        // THEN: Problem Details body contains status = 500
        problemDetails.Should().NotBeNull();
        problemDetails!.Status.Should().Be(StatusCodes.Status500InternalServerError);
    }

    [Fact]
    public async Task GivenUnhandledException_WhenErrorPropagates_ThenBodyContainsTitleField()
    {
        // GIVEN: A minimal ASP.NET Core app with ExceptionHandlingMiddleware
        var builder = WebApplication.CreateBuilder([]);
        builder.WebHost.UseTestServer();
        var app = builder.Build();

        app.UseMiddleware<ExceptionHandlingMiddleware>();
        app.MapGet("/throw", () => { throw new InvalidOperationException("secret error"); });

        await app.StartAsync();

        using var client = app.GetTestClient();

        // WHEN: The request triggers the unhandled exception
        var response = await client.GetAsync("/throw");
        var problemDetails = await response.Content.ReadFromJsonAsync<ProblemDetails>();

        // THEN: Problem Details body contains a non-empty title (NFR6: no exception message exposed)
        problemDetails.Should().NotBeNull();
        problemDetails!.Title.Should().NotBeNullOrWhiteSpace();
        problemDetails.Title.Should().NotContain("secret error");
    }

    [Fact]
    public async Task GivenUnhandledException_WhenErrorPropagates_ThenDetailFieldIsNull()
    {
        // GIVEN: A minimal ASP.NET Core app with ExceptionHandlingMiddleware
        var builder = WebApplication.CreateBuilder([]);
        builder.WebHost.UseTestServer();
        var app = builder.Build();

        app.UseMiddleware<ExceptionHandlingMiddleware>();
        app.MapGet("/throw", () => { throw new InvalidOperationException("secret error"); });

        await app.StartAsync();

        using var client = app.GetTestClient();

        // WHEN: The request triggers the unhandled exception
        var response = await client.GetAsync("/throw");
        var problemDetails = await response.Content.ReadFromJsonAsync<ProblemDetails>();

        // THEN: detail field is null — never exposes ex.Message or stack traces (NFR6)
        problemDetails.Should().NotBeNull();
        problemDetails!.Detail.Should().BeNull();
    }

    [Fact]
    public async Task GivenUnhandledException_WhenErrorPropagates_ThenExceptionMessageIsNotExposed()
    {
        // GIVEN: A minimal ASP.NET Core app with ExceptionHandlingMiddleware
        //        throwing an exception with a sensitive message
        const string sensitiveMessage = "connection string: Password=supersecret123";

        var builder = WebApplication.CreateBuilder([]);
        builder.WebHost.UseTestServer();
        var app = builder.Build();

        app.UseMiddleware<ExceptionHandlingMiddleware>();
        app.MapGet("/throw", () => { throw new InvalidOperationException(sensitiveMessage); });

        await app.StartAsync();

        using var client = app.GetTestClient();

        // WHEN: The request triggers the exception with the sensitive message
        var response = await client.GetAsync("/throw");
        var body = await response.Content.ReadAsStringAsync();

        // THEN: The sensitive message is NOT present in the response body (NFR6 security)
        body.Should().NotContain(sensitiveMessage);
        body.Should().NotContain("supersecret123");
    }

    [Fact]
    public async Task GivenNoException_WhenRequestIsProcessed_ThenMiddlewarePassesThrough()
    {
        // GIVEN: A minimal ASP.NET Core app with ExceptionHandlingMiddleware
        //        and a healthy endpoint
        var builder = WebApplication.CreateBuilder([]);
        builder.WebHost.UseTestServer();
        var app = builder.Build();

        app.UseMiddleware<ExceptionHandlingMiddleware>();
        app.MapGet("/health", () => Results.Ok("healthy"));

        await app.StartAsync();

        using var client = app.GetTestClient();

        // WHEN: The request does NOT throw an exception
        var response = await client.GetAsync("/health");

        // THEN: The middleware passes through to the next handler (status 200)
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
