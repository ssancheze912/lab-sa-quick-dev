using SiesaAgents.Application.Clientes.Queries;

namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    public static void MapClienteEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/clientes");

        group.MapGet("/", async (GetClientesQueryHandler handler, CancellationToken cancellationToken) =>
        {
            var clientes = await handler.Handle(new GetClientesQuery(), cancellationToken);
            return Results.Ok(clientes);
        });
    }
}
