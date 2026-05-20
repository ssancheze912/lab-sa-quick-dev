using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

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
            _logger.LogError(ex, "Unhandled exception");
            await WriteProblemDetailsAsync(context, ex);
        }
    }

    private static async Task WriteProblemDetailsAsync(HttpContext context, Exception ex)
    {
        var statusCode = ex switch
        {
            ArgumentException => StatusCodes.Status400BadRequest,
            KeyNotFoundException => StatusCodes.Status404NotFound,
            InvalidOperationException => StatusCodes.Status409Conflict,
            _ => StatusCodes.Status500InternalServerError
        };

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = GetTitle(statusCode),
            Detail = "An unexpected error occurred. Please try again later.",
        };

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/problem+json";

        // CRITICAL: serialize ONLY the ProblemDetails fields — NEVER include ex.StackTrace or ex.GetType().Name
        await context.Response.WriteAsync(JsonSerializer.Serialize(problemDetails, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        }));
    }

    private static string GetTitle(int statusCode) => statusCode switch
    {
        400 => "Bad Request",
        404 => "Not Found",
        409 => "Conflict",
        _ => "Internal Server Error"
    };
}
