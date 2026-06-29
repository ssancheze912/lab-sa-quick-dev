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

        group.MapGet("/{id:guid}", async (
                Guid id,
                GetClienteByIdQueryHandler handler,
                CancellationToken ct) =>
            {
                var result = await handler.HandleAsync(new GetClienteByIdQuery(id), ct);
                return result is null
                    ? Results.Problem(
                        title: "Cliente no encontrado",
                        statusCode: StatusCodes.Status404NotFound,
                        type: "https://tools.ietf.org/html/rfc7231#section-6.5.4",
                        instance: $"/api/v1/clientes/{id}",
                        detail: null)
                    : Results.Ok(result);
            })
            .WithName("GetClienteById")
            .WithOpenApi();

        return app;
    }
}
