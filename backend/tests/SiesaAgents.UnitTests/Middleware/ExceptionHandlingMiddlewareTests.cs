using System.Net;
using System.Text.Json;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using SiesaAgents.API.Middleware;
using SiesaAgents.Domain.Exceptions;
using Xunit;

namespace SiesaAgents.UnitTests.Middleware;

public class ExceptionHandlingMiddlewareTests
{
    private static IHost BuildHost(Exception exceptionToThrow)
    {
        return new HostBuilder()
            .ConfigureWebHost(webBuilder =>
            {
                webBuilder.UseTestServer();
                webBuilder.ConfigureServices(services =>
                {
                    services.AddLogging();
                    services.AddRouting();
                });
                webBuilder.Configure(app =>
                {
                    app.UseMiddleware<ExceptionHandlingMiddleware>();
                    app.Run(_ => throw exceptionToThrow);
                });
            })
            .Build();
    }

    [Fact]
    public async Task UnhandledException_Returns500_WithProblemDetails_NoStackTrace()
    {
        // Arrange
        using var host = BuildHost(new InvalidOperationException("Something went wrong internally"));
        await host.StartAsync();
        var client = host.GetTestClient();

        // Act
        var response = await client.GetAsync("/");

        // Assert
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var body = await response.Content.ReadAsStringAsync();
        var problem = JsonSerializer.Deserialize<ProblemDetails>(body, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.NotNull(problem);
        Assert.Equal(500, problem.Status);
        Assert.Equal("Internal Server Error", problem.Title);
        // Stack trace must NOT appear in response body
        Assert.DoesNotContain("at ", body);
        Assert.DoesNotContain("System.", body.Replace("\"System.", "REPLACED"));
    }

    [Fact]
    public async Task NotFoundException_Returns404_WithProblemDetails()
    {
        // Arrange
        using var host = BuildHost(new NotFoundException("Resource with id '42' was not found"));
        await host.StartAsync();
        var client = host.GetTestClient();

        // Act
        var response = await client.GetAsync("/");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var body = await response.Content.ReadAsStringAsync();
        var problem = JsonSerializer.Deserialize<ProblemDetails>(body, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.NotNull(problem);
        Assert.Equal(404, problem.Status);
        Assert.Equal("Not Found", problem.Title);
        Assert.Contains("42", problem.Detail ?? string.Empty);
    }

    [Fact]
    public async Task ConflictException_Returns409_WithProblemDetails()
    {
        // Arrange
        using var host = BuildHost(new ConflictException("A resource with this name already exists"));
        await host.StartAsync();
        var client = host.GetTestClient();

        // Act
        var response = await client.GetAsync("/");

        // Assert
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var body = await response.Content.ReadAsStringAsync();
        var problem = JsonSerializer.Deserialize<ProblemDetails>(body, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.NotNull(problem);
        Assert.Equal(409, problem.Status);
        Assert.Equal("Conflict", problem.Title);
    }

    [Fact]
    public async Task ProblemDetailsContentType_IsApplicationProblemJson()
    {
        // Arrange
        using var host = BuildHost(new NotFoundException("Not found"));
        await host.StartAsync();
        var client = host.GetTestClient();

        // Act
        var response = await client.GetAsync("/");

        // Assert
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task ValidationException_Returns400_WithValidationProblemDetails()
    {
        // Arrange
        var failures = new List<ValidationFailure>
        {
            new("Name", "Name is required"),
            new("Email", "Email must be a valid email address")
        };
        using var host = BuildHost(new ValidationException(failures));
        await host.StartAsync();
        var client = host.GetTestClient();

        // Act
        var response = await client.GetAsync("/");

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("Validation Failed", body);
    }
}
