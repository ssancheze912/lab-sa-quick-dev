using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;

namespace SiesaAgents.API.Endpoints;

/// <summary>
/// Minimal API endpoints for the Clientes aggregate.
///
/// Story 2.1 registers only <c>GET /api/v1/clientes</c>. Later stories will add:
///   - Story 2.2 → GET /api/v1/clientes/{id}
///   - Story 2.3 → POST /api/v1/clientes
///   - Story 2.4 → PUT /api/v1/clientes/{id}
///   - Story 2.5 → DELETE /api/v1/clientes/{id}
/// </summary>
public static class ClienteEndpoints
{
    public static IEndpointRouteBuilder MapClienteEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/clientes", async (
                GetClientesQueryHandler handler,
                CancellationToken ct) =>
            {
                var result = await handler.HandleAsync(new GetClientesQuery(), ct);
                return Results.Ok(result);
            })
            .WithName("GetClientes")
            .WithTags("Clientes")
            .Produces<IReadOnlyList<ClienteDto>>(StatusCodes.Status200OK);

        return app;
    }
}
