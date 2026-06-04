using Microsoft.AspNetCore.Mvc;

namespace SiesaAgents.API.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
        {
            // Client disconnected — not an application error, suppress silently
            context.Response.StatusCode = 499;
        }
        catch (KeyNotFoundException)
        {
            context.Response.ContentType = "application/problem+json";
            context.Response.StatusCode = 404;
            await context.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Status = 404,
                Title = "Resource not found.",
                Detail = null
            });
        }
        catch (ArgumentException)
        {
            context.Response.ContentType = "application/problem+json";
            context.Response.StatusCode = 400;
            await context.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Status = 400,
                Title = "Invalid request.",
                Detail = null
            });
        }
        catch (InvalidOperationException)
        {
            context.Response.ContentType = "application/problem+json";
            context.Response.StatusCode = 400;
            await context.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Status = 400,
                Title = "Invalid request.",
                Detail = null
            });
        }
        catch (Exception)
        {
            context.Response.ContentType = "application/problem+json";
            context.Response.StatusCode = 500;
            await context.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Status = 500,
                Title = "An unexpected error occurred.",
                Detail = null
            });
        }
    }
}
