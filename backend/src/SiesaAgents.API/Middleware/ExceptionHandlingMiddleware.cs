using Microsoft.AspNetCore.Mvc;

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
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;

            var problem = new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "An unexpected error occurred.",
                Detail = null, // Never expose ex.Message or stack traces
            };

            // NOTE: WriteAsJsonAsync always sets Response.ContentType itself
            // (defaulting to "application/json; charset=utf-8"), overwriting
            // any value assigned beforehand. The RFC 7807 media type must be
            // passed explicitly here, or the response silently stops being
            // "application/problem+json" despite the ProblemDetails payload.
            await context.Response.WriteAsJsonAsync(problem, options: null, contentType: "application/problem+json");
        }
    }
}
