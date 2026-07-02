using SiesaAgents.Application.Clientes.Queries;

namespace SiesaAgents.API.Endpoints;

/// <summary>
/// Minimal API endpoints for the Cliente aggregate. Story 2.1 exposes GET /api/v1/clientes;
/// write endpoints land in Stories 2.3–2.5.
/// </summary>
public static class ClienteEndpoints
{
    public static IEndpointRouteBuilder MapClienteEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/clientes").WithTags("Clientes");

        group.MapGet("/", async (GetClientesQueryHandler handler, CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(new GetClientesQuery(), ct);
            return Results.Ok(result);
        })
        .WithName("GetClientes");

        return app;
    }
}
