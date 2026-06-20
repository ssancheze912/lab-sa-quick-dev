using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;

namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    public static void MapClienteEndpoints(this WebApplication app)
    {
        app.MapGet("/api/v1/clientes", async (GetClientesQueryHandler handler, CancellationToken ct) =>
        {
            var result = await handler.Handle(new GetClientesQuery(), ct);
            return Results.Ok(result);
        })
        .WithName("GetClientes")
        .Produces<IEnumerable<ClienteDto>>(StatusCodes.Status200OK);
    }
}
