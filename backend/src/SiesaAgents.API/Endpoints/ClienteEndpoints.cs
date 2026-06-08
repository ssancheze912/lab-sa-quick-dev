using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;

namespace SiesaAgents.API.Endpoints;

/// <summary>
/// Minimal API endpoints for the Clientes domain. Currently exposes the
/// read-side <c>GET /api/v1/clientes</c>; commands (POST/PUT/DELETE) ship in
/// Stories 2.3 / 2.4 / 2.5 under the same MapGroup.
/// </summary>
public static class ClienteEndpoints
{
    public static IEndpointRouteBuilder MapClienteEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/v1/clientes").WithTags("Clientes");

        group.MapGet("", async (GetClientesQueryHandler handler, CancellationToken ct) =>
            {
                var items = await handler.HandleAsync(new GetClientesQuery(), ct);
                return Results.Ok(items);
            })
            .WithName("GetClientes")
            .Produces<IReadOnlyList<ClienteDto>>(StatusCodes.Status200OK);

        return routes;
    }
}
