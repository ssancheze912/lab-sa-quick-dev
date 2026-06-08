using Microsoft.AspNetCore.Mvc;

namespace SiesaAgents.API.Middleware;

/// <summary>
/// Catches all unhandled exceptions and returns RFC 7807 Problem Details.
/// Sensitive details (exception message, stack trace) are NEVER exposed in the response (NFR6).
/// </summary>
public class ExceptionHandlingMiddleware(
    RequestDelegate next,
    ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception captured by ExceptionHandlingMiddleware");

            if (context.Response.HasStarted)
            {
                throw;
            }

            context.Response.Clear();
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;

            var problem = new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "An unexpected error occurred.",
                Type = "https://tools.ietf.org/html/rfc7231#section-6.6.1",
                Instance = context.Request.Path
            };

            await context.Response.WriteAsJsonAsync(
                problem,
                options: null,
                contentType: "application/problem+json");
        }
    }
}
