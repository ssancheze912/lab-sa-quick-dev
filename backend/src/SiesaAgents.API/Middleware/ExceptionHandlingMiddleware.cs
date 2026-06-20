using Microsoft.AspNetCore.Mvc;
using SiesaAgents.Application.Common.Exceptions;

namespace SiesaAgents.API.Middleware;

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
            logger.LogWarning(ex, "Resource not found on {Method} {Path}",
                context.Request.Method, context.Request.Path);

            context.Response.ContentType = "application/problem+json";
            context.Response.StatusCode = StatusCodes.Status404NotFound;

            var problem = new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Recurso no encontrado",
                Detail = ex.Message,
                Type = "https://tools.ietf.org/html/rfc7807"
            };

            await context.Response.WriteAsJsonAsync(problem);
        }
        catch (ConflictException ex)
        {
            logger.LogWarning(ex, "Conflict on {Method} {Path}",
                context.Request.Method, context.Request.Path);

            context.Response.ContentType = "application/problem+json";
            context.Response.StatusCode = StatusCodes.Status409Conflict;

            var problem = new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Conflicto de datos",
                Detail = ex.Message,
                Type = "https://tools.ietf.org/html/rfc7807"
            };

            await context.Response.WriteAsJsonAsync(problem);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception on {Method} {Path}",
                context.Request.Method, context.Request.Path);

            context.Response.ContentType = "application/problem+json";
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;

            var problem = new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "An unexpected error occurred.",
                Detail = null  // Never expose ex.Message or stack traces
            };

            await context.Response.WriteAsJsonAsync(problem);
        }
    }
}
