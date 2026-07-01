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
            logger.LogError(ex, "Unhandled exception");

            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            // Microsoft.AspNetCore.Mvc.ProblemDetails hard-codes [JsonIgnore(Condition = WhenWritingNull)]
            // on Detail, which drops the "detail" key entirely when null — AC #2 requires status/title/detail
            // always present (detail explicitly null). A plain anonymous object avoids that attribute.
            await context.Response.WriteAsJsonAsync(
                new { status = StatusCodes.Status500InternalServerError, title = "An unexpected error occurred.", detail = (string?)null },
                options: null,
                contentType: "application/problem+json");
        }
    }
}
