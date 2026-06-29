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

        return app;
    }
}
