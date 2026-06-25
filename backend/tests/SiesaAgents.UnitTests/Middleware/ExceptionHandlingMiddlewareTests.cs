using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Middleware;

public class ExceptionHandlingMiddlewareTests : IClassFixture<ExceptionHandlingMiddlewareTests.ThrowingAppFactory>
{
    private readonly HttpClient _client;

    public ExceptionHandlingMiddlewareTests(ThrowingAppFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task UnhandledException_Returns500WithProblemDetails()
    {
        // Arrange — endpoint registered in ThrowingAppFactory that throws

        // Act
        var response = await _client.GetAsync("/test-exception");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
        response.Content.Headers.ContentType!.MediaType.Should().Be("application/problem+json");

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("status").GetInt32().Should().Be(500);
        body.GetProperty("title").GetString().Should().Be("An unexpected error occurred.");

        // detail must be null — never expose ex.Message
        var detail = body.GetProperty("detail");
        detail.ValueKind.Should().Be(JsonValueKind.Null);
    }

    [Fact]
    public async Task NormalRequest_DoesNotIntercept_Returns200()
    {
        // Arrange — /health endpoint registered in ThrowingAppFactory

        // Act
        var response = await _client.GetAsync("/health");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    /// <summary>
    /// Custom WebApplicationFactory that overrides the DB to use InMemory (no real PostgreSQL needed)
    /// and registers a test endpoint that intentionally throws.
    /// </summary>
    public class ThrowingAppFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.ConfigureTestServices(services =>
            {
                // Remove the real PostgreSQL DbContext registration
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                if (descriptor is not null)
                    services.Remove(descriptor);

                // Replace with in-memory database so no real connection is needed
                services.AddDbContext<AppDbContext>(options =>
                    options.UseInMemoryDatabase("TestDb_ExceptionMiddleware"));
            });

            builder.Configure(app =>
            {
                // Register the exception-handling middleware first
                app.UseMiddleware<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>();

                // Register a test endpoint that throws an unhandled exception
                app.Map("/test-exception", _ => throw new InvalidOperationException("Test exception"));

                // Register a healthy endpoint
                app.Map("/health", ctx =>
                {
                    ctx.Response.StatusCode = 200;
                    return ctx.Response.WriteAsync("OK");
                });
            });
        }
    }
}
