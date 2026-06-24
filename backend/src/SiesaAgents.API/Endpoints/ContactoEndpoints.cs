using SiesaAgents.Application.Contactos.Queries;

namespace SiesaAgents.API.Endpoints;

public static class ContactoEndpoints
{
    public static void MapContactoEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/contactos", async (GetContactosQueryHandler handler, CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(new GetContactosQuery(), ct);
            return Results.Ok(result);
        })
        .WithName("GetContactos")
        .WithSummary("List all contacts");
    }
}
