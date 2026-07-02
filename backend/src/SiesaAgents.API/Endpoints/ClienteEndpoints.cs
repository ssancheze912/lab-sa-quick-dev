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

        // Story 2.2 — Cliente detail. The {id:guid} route constraint refuses
        // to bind non-GUID segments (framework emits a 4xx Problem Details for
        // those), so the handler is only invoked for real GUIDs.
        group.MapGet("/{id:guid}", async (
            Guid id,
            GetClienteByIdQueryHandler handler,
            HttpContext http,
            CancellationToken ct) =>
        {
            var dto = await handler.HandleAsync(new GetClienteByIdQuery(id), ct);
            if (dto is null)
            {
                return Results.Problem(
                    title: "Cliente no encontrado",
                    detail: $"No existe ningún cliente con id {id}.",
                    statusCode: StatusCodes.Status404NotFound,
                    type: "https://tools.ietf.org/html/rfc9110#section-15.5.5",
                    instance: http.Request.Path);
            }

            return Results.Ok(dto);
        })
        .WithName("GetClienteById");

        return app;
    }
}
