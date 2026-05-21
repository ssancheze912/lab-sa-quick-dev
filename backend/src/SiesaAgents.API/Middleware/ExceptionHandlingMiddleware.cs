using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using SiesaAgents.Domain.Exceptions;
using System.Text.Json;

namespace SiesaAgents.API.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next ?? throw new ArgumentNullException(nameof(next));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);

            // Handle non-exception 4xx/5xx responses with empty bodies (e.g. routing 404)
            if (context.Response.StatusCode >= 400 && !context.Response.HasStarted)
            {
                await WriteStatusCodeProblemDetailsAsync(context, context.Response.StatusCode);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception");
            await WriteProblemDetailsAsync(context, ex);
        }
    }

    private static async Task WriteStatusCodeProblemDetailsAsync(HttpContext context, int statusCode)
    {
        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = GetTitle(statusCode),
            Detail = GetDetail(statusCode),
        };

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/problem+json";

        await context.Response.WriteAsync(JsonSerializer.Serialize(problemDetails, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
        }));
    }

    private static async Task WriteProblemDetailsAsync(HttpContext context, Exception ex)
    {
        var statusCode = ex switch
        {
            ValidationException => StatusCodes.Status400BadRequest,
            ArgumentException => StatusCodes.Status400BadRequest,
            KeyNotFoundException => StatusCodes.Status404NotFound,
            ConflictException => StatusCodes.Status409Conflict,
            InvalidOperationException => StatusCodes.Status409Conflict,
            _ => StatusCodes.Status500InternalServerError
        };

        var detail = ex switch
        {
            ValidationException vex => string.Join("; ", vex.Errors.Select(e => e.ErrorMessage)),
            ConflictException cex => cex.Message,
            _ => "An unexpected error occurred. Please try again later.",
        };

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = GetTitle(statusCode),
            Detail = detail,
        };

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/problem+json";

        // CRITICAL: serialize ONLY the ProblemDetails fields — NEVER include ex.StackTrace or ex.GetType().Name
        await context.Response.WriteAsync(JsonSerializer.Serialize(problemDetails, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
        }));
    }

    private static string GetTitle(int statusCode) => statusCode switch
    {
        400 => "Bad Request",
        404 => "Not Found",
        409 => "Conflict",
        _ => "Internal Server Error"
    };

    private static string GetDetail(int statusCode) => statusCode switch
    {
        404 => "The requested resource was not found.",
        400 => "The request was invalid.",
        409 => "A conflict occurred with the current state of the resource.",
        _ => "An unexpected error occurred. Please try again later."
    };
}
