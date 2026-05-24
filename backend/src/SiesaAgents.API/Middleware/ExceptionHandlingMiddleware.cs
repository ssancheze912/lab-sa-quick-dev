using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

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
            context.Response.StatusCode = 500;
            context.Response.ContentType = "application/problem+json";
            var problemDetails = new ProblemDetails
            {
                Status = 500,
                Title = "An unexpected error occurred.",
                Detail = null
            };
            var json = JsonSerializer.Serialize(problemDetails);
            await context.Response.WriteAsync(json);
        }
    }
}
