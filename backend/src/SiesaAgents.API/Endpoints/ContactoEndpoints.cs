using SiesaAgents.Application.Contactos.Queries;

namespace SiesaAgents.API.Endpoints;

public static class ContactoEndpoints
{
    public static void MapContactoEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/contactos", async (GetContactosQueryHandler handler) =>
        {
            var contactos = await handler.HandleAsync(new GetContactosQuery());
            return Results.Ok(contactos);
        })
        .WithName("GetContactos")
        .WithSummary("Obtiene todos los contactos")
        .Produces(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status500InternalServerError);
    }
}
