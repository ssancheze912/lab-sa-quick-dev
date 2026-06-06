using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Npgsql;
using SiesaAgents.API.Middleware;
using System.Text.Json;

namespace SiesaAgents.UnitTests.Middleware;

public class ExceptionHandlingMiddlewareDbTests
{
    [Fact]
    public async Task NpgsqlException_Returns503_WithProblemDetails()
    {
        // Arrange
        RequestDelegate next = (_) => throw new NpgsqlException("Connection refused");

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(503, context.Response.StatusCode);
        Assert.Equal("application/problem+json", context.Response.ContentType);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var problemDetails = JsonSerializer.Deserialize<JsonElement>(body);

        Assert.Equal(503, problemDetails.GetProperty("status").GetInt32());
        Assert.Equal("Database unavailable.", problemDetails.GetProperty("title").GetString());
    }

    [Fact]
    public async Task NpgsqlException_DoesNotExposeConnectionDetails()
    {
        // Arrange
        const string sensitiveConnectionString = "Host=prod-db;Database=secret;Password=topsecret";
        RequestDelegate next = (_) => throw new NpgsqlException(sensitiveConnectionString);

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();

        Assert.DoesNotContain(sensitiveConnectionString, body);
        // detail must be null (not serialized or serialized as null)
        var problemDetails = JsonSerializer.Deserialize<JsonElement>(body);
        var hasDetail = problemDetails.TryGetProperty("detail", out var detailValue);
        if (hasDetail)
        {
            Assert.Equal(JsonValueKind.Null, detailValue.ValueKind);
        }
    }

    [Fact]
    public async Task GenericException_Returns500_NeverExposesMessage()
    {
        // Arrange
        const string sensitiveMessage = "Internal server error with secret data";
        RequestDelegate next = (_) => throw new InvalidOperationException(sensitiveMessage);

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(500, context.Response.StatusCode);
        Assert.Equal("application/problem+json", context.Response.ContentType);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();

        Assert.DoesNotContain(sensitiveMessage, body);

        var problemDetails = JsonSerializer.Deserialize<JsonElement>(body);
        var hasDetail = problemDetails.TryGetProperty("detail", out var detailValue);
        if (hasDetail)
        {
            Assert.Equal(JsonValueKind.Null, detailValue.ValueKind);
        }
    }
}
