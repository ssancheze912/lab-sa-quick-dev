using System.Text.Json;

namespace SiesaAgents.API.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next)
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.Never
    };

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

                // RFC 7807 Problem Details — always include status, title, detail
                // Detail is always null — never expose internal error messages (NFR6)
                var problemDetails = new
                {
                    status = 500,
                    title = "An unexpected error occurred.",
                    detail = (string?)null
                };

                await context.Response.WriteAsync(JsonSerializer.Serialize(problemDetails, SerializerOptions));
            }
        }
    }
}
