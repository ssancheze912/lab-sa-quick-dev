using System.Text.Json;
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
        catch (Exception)
        {
            if (!context.Response.HasStarted)
            {
                context.Response.ContentType = "application/problem+json";
                context.Response.StatusCode = 500;

                var problem = new ProblemDetails
                {
                    Status = 500,
                    Title = "An unexpected error occurred.",
                    Detail = null  // Never expose internal details
                };

                await context.Response.WriteAsync(JsonSerializer.Serialize(problem, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                }));
            }
        }
    }
}
