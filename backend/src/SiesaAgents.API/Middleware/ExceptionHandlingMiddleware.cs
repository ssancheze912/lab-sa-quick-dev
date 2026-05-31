using Microsoft.AspNetCore.Mvc;

namespace SiesaAgents.API.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);

            // Handle non-exception error status codes (e.g., 404 from unmatched routes)
            if (!context.Response.HasStarted && context.Response.StatusCode >= 400)
            {
                var statusCode = context.Response.StatusCode;
                context.Response.ContentType = "application/problem+json";
                await context.Response.WriteAsJsonAsync(new ProblemDetails
                {
                    Status = statusCode,
                    Title = statusCode switch
                    {
                        404 => "The requested resource was not found.",
                        400 => "Bad request.",
                        401 => "Unauthorized.",
                        403 => "Forbidden.",
                        _ => "An error occurred."
                    }
                });
            }
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
