using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace SiesaAgents.API.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next)
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception)
        {
            var problem = new ProblemDetails
            {
                Status = 500,
                Title = "An unexpected error occurred.",
                Detail = null   // Never expose ex.Message or stack traces
            };

            context.Response.StatusCode = 500;
            context.Response.ContentType = "application/problem+json";

            var json = JsonSerializer.Serialize(problem, JsonOptions);
            await context.Response.WriteAsync(json);
        }
    }
}
