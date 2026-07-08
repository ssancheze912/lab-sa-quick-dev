using Microsoft.AspNetCore.Mvc;
using SiesaAgents.Domain.Clientes.Exceptions;

namespace SiesaAgents.API.Middleware;

/// <summary>
/// Global exception-handling middleware. Catches any unhandled exception and returns a
/// Problem Details (RFC 7807) response without exposing implementation details.
/// </summary>
public sealed class ExceptionHandlingMiddleware
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
        catch (ClienteNitConflictException)
        {
            // Story 2.3 — 409 Conflict for duplicate NIT/RUC. The user-facing
            // Spanish detail lives here (separation of concerns from the
            // domain exception message). No stackTrace / exception leak (NFR6).
            if (context.Response.HasStarted)
            {
                throw;
            }

            context.Response.Clear();
            context.Response.StatusCode = StatusCodes.Status409Conflict;
            context.Response.ContentType = "application/problem+json";

            var problem = new ProblemDetails
            {
                Type = "https://tools.ietf.org/html/rfc7231#section-6.5.8",
                Title = "Conflict",
                Status = StatusCodes.Status409Conflict,
                Detail = "El NIT/RUC ya está registrado",
                Instance = context.Request.Path,
            };

            await context.Response.WriteAsJsonAsync(problem, options: null, contentType: "application/problem+json");
            return;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception while processing {Method} {Path}", context.Request.Method, context.Request.Path);

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
                Type = "https://tools.ietf.org/html/rfc7231#section-6.6.1",
                Instance = context.Request.Path,
            };

            // WriteAsJsonAsync(object) forces Content-Type back to application/json.
            // Pass the explicit content type so the RFC 7807 media type sticks.
            await context.Response.WriteAsJsonAsync(problem, options: null, contentType: "application/problem+json");
        }
    }
}
