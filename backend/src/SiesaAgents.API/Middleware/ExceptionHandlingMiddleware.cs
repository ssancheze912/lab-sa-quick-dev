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

            var problem = new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "Ocurrió un error inesperado.",
                // RFC 9110 obsoleted RFC 7231 (June 2022); point clients at the current spec.
                Type = "https://www.rfc-editor.org/rfc/rfc9110#section-15.6.1",
                Detail = "Contacta al administrador si el problema persiste.",
                Instance = context.Request.Path,
            };

            // WriteAsJsonAsync overrides Content-Type — pass the RFC 7807 media type explicitly.
            await context.Response.WriteAsJsonAsync(
                problem,
                options: null,
                contentType: "application/problem+json");
        }
    }
}
