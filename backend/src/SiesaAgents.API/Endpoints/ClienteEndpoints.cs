using SiesaAgents.Application.Clientes.Queries;

namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    public static void MapClienteEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/v1/clientes");
        group.MapGet("/", GetAllClientes);
    }

    private static async Task<IResult> GetAllClientes(
        GetClientesQueryHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new GetClientesQuery(), cancellationToken);
        return Results.Ok(result);
    }
}
