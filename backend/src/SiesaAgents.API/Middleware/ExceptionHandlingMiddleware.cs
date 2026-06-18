using Microsoft.AspNetCore.Mvc;

namespace SiesaAgents.API.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);

            // Handle routing 404s (no endpoint matched) — response has not started yet
            if (!context.Response.HasStarted && context.Response.StatusCode == 404)
            {
                context.Response.ContentType = "application/problem+json";
                await context.Response.WriteAsJsonAsync(new ProblemDetails
                {
                    Status = 404,
                    Title = "Resource not found.",
                    Detail = null
                });
            }
        }
        catch (Exception)
        {
            if (!context.Response.HasStarted)
            {
                context.Response.ContentType = "application/problem+json";
                context.Response.StatusCode = 500;
                await context.Response.WriteAsJsonAsync(new ProblemDetails
                {
                    Status = 500,
                    Title = "An unexpected error occurred.",
                    Detail = null // Never expose ex.Message or stack traces
                });
            }
        }
    }
}
