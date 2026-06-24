using Microsoft.AspNetCore.Mvc;
using SiesaAgents.Domain.Exceptions;

namespace SiesaAgents.API.Middleware;

public class ExceptionHandlingMiddleware(ILogger<ExceptionHandlingMiddleware> logger) : IMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (status, title, detail) = exception switch
        {
            NotFoundException => (404, "Resource Not Found", exception.Message),
            KeyNotFoundException => (404, "Resource Not Found", exception.Message),
            ConflictException => (409, "Conflict", exception.Message),
            ArgumentException => (400, "Bad Request", exception.Message),
            _ => (500, "Internal Server Error", "An unexpected error occurred.")
        };

        context.Response.StatusCode = status;
        context.Response.ContentType = "application/problem+json";

        var problem = new ProblemDetails
        {
            Status = status,
            Title = title,
            Detail = detail,
            Type = "https://tools.ietf.org/html/rfc7807"
        };

        await context.Response.WriteAsJsonAsync(problem);
    }
}
