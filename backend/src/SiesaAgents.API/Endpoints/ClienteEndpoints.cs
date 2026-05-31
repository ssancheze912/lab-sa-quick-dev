using SiesaAgents.Application.Clientes.Queries;

namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    public static void MapClienteEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/v1/clientes");

        group.MapGet("/", async (GetClientesQueryHandler handler) =>
        {
            var clientes = await handler.HandleAsync(new GetClientesQuery());
            return Results.Ok(clientes);
        });

        group.MapGet("/{id:guid}", async (Guid id, GetClienteByIdQueryHandler handler) =>
        {
            var cliente = await handler.HandleAsync(new GetClienteByIdQuery(id));
            return cliente is null ? Results.NotFound() : Results.Ok(cliente);
        });
    }
}
