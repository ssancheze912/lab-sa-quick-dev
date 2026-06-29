using Microsoft.AspNetCore.Mvc;
using SiesaAgents.Application.Contactos.Queries;

namespace SiesaAgents.API.Endpoints;

public static class ContactosEndpoints
{
    public static IEndpointRouteBuilder MapContactosEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/contactos", async (IGetContactosQueryHandler handler) =>
        {
            var contactos = await handler.HandleAsync(new GetContactosQuery());
            return Results.Ok(contactos);
        })
        .WithName("GetContactos")
        .WithSummary("Get all contacts");

        app.MapGet("/api/v1/contactos/{id:guid}", async (Guid id, IGetContactoByIdQueryHandler handler) =>
        {
            var contacto = await handler.HandleAsync(new GetContactoByIdQuery(id));

            if (contacto is null)
            {
                var problem = new ProblemDetails
                {
                    Status = StatusCodes.Status404NotFound,
                    Title = "Contacto no encontrado",
                    Detail = $"No existe un contacto con id '{id}'."
                };
                return Results.Json(problem, statusCode: StatusCodes.Status404NotFound, contentType: "application/problem+json");
            }

            return Results.Ok(contacto);
        })
        .WithName("GetContactoById")
        .WithSummary("Get contact by ID");

        // Catch-all for invalid UUID format — returns 400 Bad Request
        app.MapGet("/api/v1/contactos/{id}", (string id) =>
        {
            var problem = new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Bad Request",
                Detail = $"El parámetro 'id' no es un UUID válido: '{id}'."
            };
            return Results.Json(problem, statusCode: StatusCodes.Status400BadRequest, contentType: "application/problem+json");
        })
        .WithName("GetContactoByIdInvalid")
        .WithSummary("Invalid contact ID format");

        return app;
    }
}
