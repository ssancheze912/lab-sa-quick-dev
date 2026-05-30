using System.Net;
using System.Text.Json;

namespace SiesaAgents.API.Middleware;

public class ExceptionHandlingMiddleware
{
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
            _logger.LogError(ex, "Unhandled exception occurred");
            if (context.Response.HasStarted)
            {
                _logger.LogWarning("Response has already started; cannot write Problem Details.");
                throw;
            }
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, title) = exception switch
        {
            ArgumentException => (HttpStatusCode.BadRequest, "Solicitud inválida"),
            KeyNotFoundException => (HttpStatusCode.NotFound, "Recurso no encontrado"),
            InvalidOperationException => (HttpStatusCode.Conflict, "Conflicto de estado"),
            _ => (HttpStatusCode.InternalServerError, "Error interno del servidor")
        };

        var problemDetails = new
        {
            type = "https://tools.ietf.org/html/rfc7807",
            title = title,
            status = (int)statusCode,
            detail = (string?)null,
            instance = context.Request.Path.Value
        };

        context.Response.StatusCode = (int)statusCode;
        context.Response.ContentType = "application/problem+json";

        var json = JsonSerializer.Serialize(problemDetails, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}
