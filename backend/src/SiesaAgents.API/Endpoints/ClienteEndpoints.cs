using SiesaAgents.Application.Clientes.Queries;

namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    public static void MapClienteEndpoints(this WebApplication app)
    {
        app.MapGet("/api/v1/clientes", async (GetClientesQueryHandler handler, CancellationToken ct) =>
            Results.Ok(await handler.HandleAsync(new GetClientesQuery(), ct)))
            .WithName("GetClientes")
            .WithTags("Clientes")
            .Produces(StatusCodes.Status200OK);
    }
}
