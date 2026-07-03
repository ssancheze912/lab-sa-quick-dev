using Microsoft.AspNetCore.Mvc;

namespace SiesaAgents.API.Middleware;

/// <summary>
/// Catches unhandled exceptions and returns a Problem Details (RFC 7807) response.
/// Never exposes exception messages or stack traces to the client.
/// </summary>
public sealed class ExceptionHandlingMiddleware(
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
            logger.LogError(ex, "Unhandled exception while processing {Path}", context.Request.Path);

            if (context.Response.HasStarted)
            {
                throw;
            }

            context.Response.Clear();
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/problem+json";

            var problem = new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "An unexpected error occurred.",
                Detail = null, // Never expose ex.Message or stack traces.
                Type = "https://tools.ietf.org/html/rfc7231#section-6.6.1",
                Instance = context.Request.Path
            };

            await context.Response.WriteAsJsonAsync(problem);
        }
    }
}
