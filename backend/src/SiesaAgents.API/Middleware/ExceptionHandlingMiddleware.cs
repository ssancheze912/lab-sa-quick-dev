using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;

namespace SiesaAgents.API.Middleware;

/// <summary>
/// Global exception handler. Converts any unhandled exception into an RFC 7807
/// Problem Details response, never leaking stack traces or exception messages.
/// </summary>
public class ExceptionHandlingMiddleware
{
    private static readonly JsonSerializerOptions ProblemJsonOptions = new()
    {
        // Suppress null/empty ProblemDetails members (Detail, Extensions) so the
        // wire response contains only status/title/type/instance — matching the
        // architecture standard. Per NFR6, no extra metadata reaches the client.
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception while processing {Path}", context.Request.Path);

            if (context.Response.HasStarted)
            {
                throw;
            }

            context.Response.Clear();
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/problem+json";

            var problem = new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "An unexpected error occurred.",
                Type = "https://tools.ietf.org/html/rfc7231#section-6.6.1",
                Instance = context.Request.Path,
                // Detail intentionally left null — NFR6 forbids leaking raw exception text.
            };

            // Serialize manually so the response keeps the application/problem+json
            // content-type (WriteAsJsonAsync would overwrite it with application/json).
            await JsonSerializer.SerializeAsync(context.Response.Body, problem, ProblemJsonOptions);
        }
    }
}
