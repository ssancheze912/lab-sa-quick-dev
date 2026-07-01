using SiesaAgents.Application.Queries.Contactos;

namespace SiesaAgents.API.Endpoints;

public static class ContactoEndpoints
{
    public static IEndpointRouteBuilder MapContactoEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/contactos", async (
                string? q,
                GetContactosQueryHandler handler,
                CancellationToken ct) =>
            {
                var result = await handler.HandleAsync(new GetContactosQuery(q), ct);
                return Results.Ok(result);
            })
            .WithName("GetContactos")
            .WithTags("Contactos");

        return app;
    }
}
