using SiesaAgents.Application.Contactos.DTOs;
using SiesaAgents.Application.Contactos.Queries;

namespace SiesaAgents.API.Endpoints;

public static class ContactoEndpoints
{
    public static void MapContactoEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/contactos").WithTags("Contactos");

        group.MapGet("/", async (GetContactosQueryHandler handler, CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(new GetContactosQuery(), ct);
            return Results.Ok(result);
        })
        .WithName("GetContactos")
        .Produces<ContactoDto[]>(StatusCodes.Status200OK);

        group.MapGet("/{id:guid}", async (Guid id, GetContactoByIdQueryHandler handler, CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(new GetContactoByIdQuery(id), ct);
            return result is null
                ? Results.Problem(statusCode: 404, title: "Not Found", detail: $"Contacto con id '{id}' no encontrado.")
                : Results.Ok(result);
        })
        .WithName("GetContactoById")
        .Produces<ContactoDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound);
    }
}
