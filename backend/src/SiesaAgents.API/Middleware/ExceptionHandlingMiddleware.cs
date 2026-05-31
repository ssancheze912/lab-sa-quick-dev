using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace SiesaAgents.API.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);

            if (!context.Response.HasStarted && context.Response.StatusCode >= 400)
            {
                var statusCode = context.Response.StatusCode;
                await WriteProblemDetailsAsync(context, statusCode, statusCode switch
                {
                    404 => "The requested resource was not found.",
                    400 => "Bad request.",
                    401 => "Unauthorized.",
                    403 => "Forbidden.",
                    _ => "An error occurred."
                });
            }
        }
        catch (Exception)
        {
            context.Response.StatusCode = 500;
            await WriteProblemDetailsAsync(context, 500, "An unexpected error occurred.");
        }
    }

    private static async Task WriteProblemDetailsAsync(HttpContext context, int status, string title)
    {
        var problem = new ProblemDetails { Status = status, Title = title };
        var json = JsonSerializer.Serialize(problem, JsonOptions);
        context.Response.ContentType = "application/problem+json";
        await context.Response.WriteAsync(json);
    }
}
