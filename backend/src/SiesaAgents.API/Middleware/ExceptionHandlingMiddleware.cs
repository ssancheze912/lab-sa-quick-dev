using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace SiesaAgents.API.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception for {Method} {Path}",
                context.Request.Method, context.Request.Path);

            // Handle PostgreSQL unique constraint violation (error code 23505)
            if (ex is DbUpdateException dbEx &&
                dbEx.InnerException is PostgresException pgEx &&
                pgEx.SqlState == "23505")
            {
                context.Response.StatusCode = StatusCodes.Status409Conflict;
                context.Response.ContentType = "application/problem+json";

                var conflictProblem = new ProblemDetails
                {
                    Status = StatusCodes.Status409Conflict,
                    Title  = "Conflict",
                    Detail = "El NIT/RUC ya está registrado."
                };

                await context.Response.WriteAsync(JsonSerializer.Serialize(conflictProblem, JsonOptions));
                return;
            }

            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/problem+json";

            var problem = new ProblemDetails
            {
                Status  = StatusCodes.Status500InternalServerError,
                Title   = "An unexpected error occurred.",
                Detail  = null   // Never expose ex.Message or stack traces
            };

            await context.Response.WriteAsync(JsonSerializer.Serialize(problem, JsonOptions));
        }
    }
}
