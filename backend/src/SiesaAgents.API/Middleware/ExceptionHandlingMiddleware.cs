using Microsoft.AspNetCore.Mvc;
using Npgsql;
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
        catch (NpgsqlException)
        {
            var problem = new ProblemDetails
            {
                Status = 503,
                Title = "Database unavailable.",
                Detail = null   // NEVER expose connection string details or exception message
            };

            context.Response.StatusCode = 503;
            context.Response.ContentType = "application/problem+json";

            var json = JsonSerializer.Serialize(problem, JsonOptions);
            await context.Response.WriteAsync(json);
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
