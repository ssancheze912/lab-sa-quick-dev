using Microsoft.AspNetCore.Mvc;
using SiesaAgents.Domain.Clientes.Exceptions;

namespace SiesaAgents.API.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (DuplicateNitException)
        {
            context.Response.ContentType = "application/problem+json";
            context.Response.StatusCode = 409;
            await context.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Status = 409,
                Title = "Conflicto de datos",
                Detail = "El NIT/RUC ya está registrado"
            });
        }
        catch (Exception)
        {
            context.Response.ContentType = "application/problem+json";
            context.Response.StatusCode = 500;
            await context.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Status = 500,
                Title = "An unexpected error occurred.",
                Detail = null
            });
        }
    }
}
