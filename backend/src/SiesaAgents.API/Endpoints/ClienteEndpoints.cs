using SiesaAgents.Application.Clientes.Queries;

namespace SiesaAgents.API.Endpoints;

/// <summary>
/// Minimal API endpoints for the Clientes aggregate.
/// Story 2.1 ships only <c>GET /api/v1/clientes</c> with optional <c>?search=</c>.
/// </summary>
public static class ClienteEndpoints
{
    public static IEndpointRouteBuilder MapClienteEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/clientes");

        group.MapGet("/", async (
                string? search,
                GetClientesQueryHandler handler,
                CancellationToken ct) =>
            {
                var result = await handler.HandleAsync(new GetClientesQuery(search), ct);
                return Results.Ok(result);
            })
            .WithName("GetClientes")
            .WithOpenApi();

        return app;
    }
}
