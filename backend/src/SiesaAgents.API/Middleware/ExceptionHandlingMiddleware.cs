using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using SiesaAgents.Domain.Exceptions;

namespace SiesaAgents.API.Middleware;

/// <summary>
/// Global exception handling middleware. Maps domain exceptions to Problem Details RFC 7807 responses.
/// Stack traces are NEVER exposed in responses (NFR6).
/// </summary>
public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (NotFoundException ex)
        {
            await WriteProblemDetailsAsync(context, StatusCodes.Status404NotFound, "Not Found", ex.Message);
        }
        catch (ConflictException ex)
        {
            await WriteProblemDetailsAsync(context, StatusCodes.Status409Conflict, "Conflict", ex.Message);
        }
        catch (ValidationException ex)
        {
            await WriteValidationProblemDetailsAsync(context, ex);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception occurred");
            // Generic message — NEVER expose stack traces (NFR6)
            await WriteProblemDetailsAsync(
                context,
                StatusCodes.Status500InternalServerError,
                "Internal Server Error",
                "An unexpected error occurred. Please try again later.");
        }
    }

    private static async Task WriteProblemDetailsAsync(HttpContext context, int status, string title, string detail)
    {
        context.Response.StatusCode = status;
        context.Response.ContentType = "application/problem+json";
        var problem = new ProblemDetails
        {
            Status = status,
            Title = title,
            Detail = detail
        };
        await context.Response.WriteAsJsonAsync(problem);
    }

    private static async Task WriteValidationProblemDetailsAsync(HttpContext context, ValidationException ex)
    {
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
        context.Response.ContentType = "application/problem+json";
        var errors = ex.Errors
            .GroupBy(e => e.PropertyName)
            .ToDictionary(
                g => g.Key,
                g => g.Select(e => e.ErrorMessage).ToArray());
        var problem = new ValidationProblemDetails(errors)
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "Validation Failed",
            Detail = "One or more validation errors occurred."
        };
        await context.Response.WriteAsJsonAsync(problem);
    }
}
