using Microsoft.AspNetCore.Mvc;

namespace SiesaAgents.API.Middleware;

/// <summary>
/// Global exception handler returning Problem Details RFC 7807 format.
/// Never exposes internal exception details to callers.
/// </summary>
public class ExceptionHandlingMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception)
        {
            context.Response.ContentType = "application/problem+json";
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;

            await context.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "An unexpected error occurred.",
                Detail = null // Never expose ex.Message or stack traces
            });
        }
    }
}
