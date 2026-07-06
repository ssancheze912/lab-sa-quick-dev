using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace SiesaAgents.API.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception occurred while processing the request.");

            context.Response.StatusCode = StatusCodes.Status500InternalServerError;

            // WriteAsJsonAsync's contentType parameter must be used (rather than setting
            // context.Response.ContentType beforehand) because the built-in
            // ProblemDetailsJsonConverter/WriteAsJsonAsync pipeline overwrites ContentType
            // with "application/json" otherwise. Detail is a fixed, non-sensitive message —
            // never the raw exception message/stack trace (NFR6) — and must be non-null so
            // the JSON converter does not omit the "detail" key from the response body.
            await context.Response.WriteAsJsonAsync(
                new ProblemDetails
                {
                    Status = StatusCodes.Status500InternalServerError,
                    Title = "An unexpected error occurred.",
                    Detail = "An unexpected error occurred. Please contact support if the problem persists.",
                },
                options: (JsonSerializerOptions?)null,
                contentType: "application/problem+json");
        }
    }
}
