using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;

namespace SiesaAgents.API.Endpoints;

/// <summary>
/// Minimal API endpoints for the <c>/api/v1/clientes</c> resource (Story 2.1).
/// Only <c>GET /</c> is exposed in this story; POST/PUT/DELETE arrive in
/// Stories 2.3–2.5.
/// </summary>
public static class ClienteEndpoints
{
    public static IEndpointRouteBuilder MapClienteEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/v1/clientes").WithTags("Clientes");

        group.MapGet("/", async (GetClientesQueryHandler handler, CancellationToken ct) =>
                Results.Ok(await handler.HandleAsync(new GetClientesQuery(), ct)))
             .WithName("GetClientes")
             .Produces<IReadOnlyList<ClienteDto>>(StatusCodes.Status200OK);

        return routes;
    }
}
