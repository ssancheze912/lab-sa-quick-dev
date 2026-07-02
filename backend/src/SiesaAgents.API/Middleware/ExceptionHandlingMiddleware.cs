using Microsoft.AspNetCore.Mvc;

namespace SiesaAgents.API.Middleware;

/// <summary>
/// Global exception handler that returns RFC 7807 Problem Details for unhandled exceptions.
/// </summary>
/// <remarks>
/// Security invariant (NFR6): the middleware NEVER writes the exception message,
/// stack trace, or inner exception to the HTTP response — those details only ever
/// reach the server log via <see cref="ILogger"/>.
/// </remarks>
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
                Title = "Ocurrió un error inesperado.",
                Type = "https://tools.ietf.org/html/rfc7231#section-6.6.1",
                Detail = "Contacta al administrador si el problema persiste.",
                Instance = context.Request.Path,
            };

            await context.Response.WriteAsJsonAsync(problem);
        }
    }
}
