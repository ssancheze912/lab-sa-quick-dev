using SiesaAgents.Application.Clientes.Queries;

namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    public static IEndpointRouteBuilder MapClienteEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/clientes");

        group.MapGet("/", async (string? q, IGetClientesQueryHandler handler, CancellationToken cancellationToken) =>
        {
            var result = await handler.HandleAsync(new GetClientesQuery(q), cancellationToken);
            return Results.Ok(result);
        });

        return app;
    }
}
