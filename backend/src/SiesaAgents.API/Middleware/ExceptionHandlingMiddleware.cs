using System.Text;
using System.Text.Json;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Clientes.Exceptions;

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
        catch (ValidationException ex)
        {
            var errors = ex.Errors.Select(e => new { field = e.PropertyName, message = e.ErrorMessage });
            await WriteProblemDetailsAsync(context, StatusCodes.Status400BadRequest, new
            {
                type = "https://tools.ietf.org/html/rfc7807",
                title = "Validation failed.",
                status = 400,
                errors
            });
        }
        catch (NotFoundException ex)
        {
            await WriteProblemDetailsAsync(context, StatusCodes.Status404NotFound, new
            {
                type = "https://tools.ietf.org/html/rfc7807",
                title = "Not Found.",
                status = 404,
                detail = ex.Message
            });
        }
        catch (ConflictException ex)
        {
            await WriteProblemDetailsAsync(context, StatusCodes.Status409Conflict, new
            {
                type = "https://tools.ietf.org/html/rfc7807",
                title = "Conflict.",
                status = 409,
                detail = ex.Message
            });
        }
        catch (DbUpdateException dbEx) when (IsUniqueConstraintViolation(dbEx))
        {
            // Unique constraint violation — race condition on NIT duplicate
            await WriteProblemDetailsAsync(context, StatusCodes.Status409Conflict, new
            {
                type = "https://tools.ietf.org/html/rfc7807",
                title = "Conflict.",
                status = 409,
                detail = "El NIT/RUC ya está registrado"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception");
            var isDevelopment = context.RequestServices
                .GetRequiredService<IWebHostEnvironment>().IsDevelopment();
            await WriteProblemDetailsAsync(context, StatusCodes.Status500InternalServerError, new
            {
                type = "https://tools.ietf.org/html/rfc7807",
                title = "Internal Server Error",
                status = 500,
                detail = isDevelopment ? ex.Message : "An unexpected error occurred."
            });
        }
    }

    private static async Task WriteProblemDetailsAsync(HttpContext context, int statusCode, object body)
    {
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/problem+json; charset=utf-8";
        var json = JsonSerializer.Serialize(body);
        await context.Response.WriteAsync(json, Encoding.UTF8);
    }

    // Detects PostgreSQL unique constraint violation (code 23505) via reflection to avoid
    // direct Npgsql dependency in the API layer.
    private static bool IsUniqueConstraintViolation(DbUpdateException ex)
    {
        var inner = ex.InnerException;
        if (inner is null) return false;
        var sqlStateProperty = inner.GetType().GetProperty("SqlState");
        var sqlState = sqlStateProperty?.GetValue(inner) as string;
        return sqlState == "23505";
    }
}
