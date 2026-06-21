using SiesaAgents.Application.Clientes.Queries;

namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    public static void MapClienteEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/v1/clientes");
        group.MapGet("/", GetAllClientes);
        group.MapGet("/{id:guid}", GetClienteById);
    }

    private static async Task<IResult> GetAllClientes(
        GetClientesQueryHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new GetClientesQuery(), cancellationToken);
        return Results.Ok(result);
    }

    private static async Task<IResult> GetClienteById(
        Guid id,
        GetClienteByIdQueryHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.Handle(new GetClienteByIdQuery(id), cancellationToken);
        return result is null
            ? Results.NotFound(new { title = "Cliente no encontrado.", status = 404 })
            : Results.Ok(result);
    }
}
