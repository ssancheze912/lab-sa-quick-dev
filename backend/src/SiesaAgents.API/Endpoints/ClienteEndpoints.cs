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

        group.MapGet("/{id:guid}", async (Guid id, GetClienteByIdQueryHandler handler, CancellationToken cancellationToken) =>
        {
            var cliente = await handler.Handle(new GetClienteByIdQuery(id), cancellationToken);
            return cliente is null ? Results.NotFound() : Results.Ok(cliente);
        });
    }
}
