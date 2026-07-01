using SiesaAgents.Application.Queries.Clientes;

namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    public static IEndpointRouteBuilder MapClienteEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/clientes", async (
                string? q,
                GetClientesQueryHandler handler,
                CancellationToken ct) =>
            {
                var result = await handler.HandleAsync(new GetClientesQuery(q), ct);
                return Results.Ok(result);
            })
            .WithName("GetClientes")
            .WithTags("Clientes");

        return app;
    }
}
