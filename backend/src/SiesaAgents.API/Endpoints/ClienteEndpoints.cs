using SiesaAgents.Application.Clientes.Queries;

namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    public static IEndpointRouteBuilder MapClienteEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/clientes", async (
            GetClientesQueryHandler handler,
            CancellationToken cancellationToken) =>
        {
            var clientes = await handler.HandleAsync(new GetClientesQuery(), cancellationToken);
            return Results.Ok(clientes);
        })
        .WithName("GetClientes")
        .WithSummary("Obtiene la lista de todos los clientes")
        .Produces(StatusCodes.Status200OK);

        return app;
    }
}
