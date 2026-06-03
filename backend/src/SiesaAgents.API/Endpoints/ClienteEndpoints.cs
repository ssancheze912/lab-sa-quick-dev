using SiesaAgents.Application.Clientes.Queries;

namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    public static void MapClienteEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/v1/clientes").WithTags("Clientes");

        group.MapGet("/", async (GetClientesQueryHandler handler) =>
        {
            var clientes = await handler.HandleAsync();
            return Results.Ok(clientes);
        })
        .WithName("GetClientes")
        .WithSummary("Get all clients");
    }
}
