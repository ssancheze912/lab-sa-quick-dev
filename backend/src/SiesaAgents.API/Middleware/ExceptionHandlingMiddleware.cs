using Microsoft.AspNetCore.Mvc;

namespace SiesaAgents.API.Middleware;

/// <summary>
/// Catches unhandled exceptions and returns Problem Details RFC 7807 responses.
/// Never exposes stack traces or internal error messages.
/// </summary>
public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception occurred while processing request {Method} {Path}",
                context.Request.Method, context.Request.Path);

            context.Response.ContentType = "application/problem+json";
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;

            await context.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "An unexpected error occurred.",
                Detail = null, // Never expose ex.Message or stack traces
                Instance = context.Request.Path,
            });
        }
    }
}
