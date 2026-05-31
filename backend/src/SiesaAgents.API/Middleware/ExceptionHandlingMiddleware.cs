namespace SiesaAgents.API.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);

            if (!context.Response.HasStarted && context.Response.StatusCode >= 400)
            {
                var statusCode = context.Response.StatusCode;
                var title = statusCode switch
                {
                    404 => "The requested resource was not found.",
                    400 => "Bad request.",
                    401 => "Unauthorized.",
                    403 => "Forbidden.",
                    _ => "An error occurred."
                };
                await WriteProblemAsync(context, statusCode, title);
            }
        }
        catch (Exception)
        {
            if (!context.Response.HasStarted)
            {
                context.Response.Clear();
                await WriteProblemAsync(context, 500, "An unexpected error occurred.");
            }
        }
    }

    private static Task WriteProblemAsync(HttpContext context, int status, string title)
        => Results.Problem(title: title, statusCode: status).ExecuteAsync(context);
}
