using Microsoft.AspNetCore.Mvc;

namespace SiesaAgents.API.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception occurred");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, title) = exception switch
        {
            KeyNotFoundException => (StatusCodes.Status404NotFound, "Resource Not Found"),
            ArgumentException => (StatusCodes.Status400BadRequest, "Bad Request"),
            InvalidOperationException => (StatusCodes.Status400BadRequest, "Invalid Operation"),
            _ => (StatusCodes.Status500InternalServerError, "Internal Server Error")
        };

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/problem+json";

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = exception.Message,
            Type = $"https://httpstatuses.io/{statusCode}"
        };

        await context.Response.WriteAsJsonAsync(problemDetails);
    }
}
