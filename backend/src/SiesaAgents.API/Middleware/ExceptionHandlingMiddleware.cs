using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using SiesaAgents.Domain.Exceptions;

namespace SiesaAgents.API.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

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
        catch (NotFoundException ex)
        {
            _logger.LogWarning(ex, "Resource not found");
            await WriteProblemDetails(context, StatusCodes.Status404NotFound, "Resource Not Found", ex.Message);
        }
        catch (ValidationException ex)
        {
            _logger.LogWarning(ex, "Validation error");
            await WriteProblemDetails(context, StatusCodes.Status400BadRequest, "Validation Error", ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error");
            // NEVER expose stack trace or internal message to client
            await WriteProblemDetails(context, StatusCodes.Status500InternalServerError, "An unexpected error occurred", null);
        }
    }

    private static async Task WriteProblemDetails(HttpContext context, int statusCode, string title, string? detail)
    {
        var problem = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = detail
        };
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/problem+json";
        var json = JsonSerializer.Serialize(problem, JsonOptions);
        await context.Response.WriteAsync(json);
    }
}
