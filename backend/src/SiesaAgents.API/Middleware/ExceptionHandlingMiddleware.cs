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

            // Handle routing 404s (no endpoint matched) — response has not started yet
            if (!context.Response.HasStarted && context.Response.StatusCode == 404)
            {
                await WriteProblemDetailsAsync(context, 404, "Resource not found.", "The requested resource was not found.");
            }
        }
        catch (Exception)
        {
            if (!context.Response.HasStarted)
            {
                await WriteProblemDetailsAsync(context, 500, "Internal Server Error", "An unexpected error occurred.");
            }
        }
    }

    private static async Task WriteProblemDetailsAsync(HttpContext context, int status, string title, string detail)
    {
        context.Response.StatusCode = status;
        context.Response.ContentType = "application/problem+json";

        var problemDetails = new
        {
            status,
            title,
            detail
        };

        var json = JsonSerializer.Serialize(problemDetails, JsonOptions);
        await context.Response.WriteAsync(json);
    }
}
