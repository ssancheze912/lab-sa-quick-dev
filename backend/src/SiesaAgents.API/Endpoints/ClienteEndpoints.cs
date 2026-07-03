using SiesaAgents.Application.Clientes.Queries;

namespace SiesaAgents.API.Endpoints;

/// <summary>
/// Minimal API endpoint group for the Clientes resource (Story 2.1).
/// Follows the <c>MapGroup</c>+<c>MapGet</c> pattern; no <c>[ApiController]</c>
/// classes per company-standards.
/// </summary>
public static class ClienteEndpoints
{
    public static IEndpointRouteBuilder MapClienteEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/clientes")
            .WithTags("Clientes");

        group.MapGet("/", async (
                GetClientesQueryHandler handler,
                CancellationToken cancellationToken) =>
            Results.Ok(await handler.HandleAsync(new GetClientesQuery(), cancellationToken)));

        // Story 2.2 — GET /api/v1/clientes/{id:guid}. The :guid route constraint
        // short-circuits any non-GUID segment to a framework 404 before the
        // handler runs. `Results.NotFound()` (parameter-less) triggers the
        // `UseStatusCodePages(...)` middleware in Program.cs, which emits the
        // RFC 7807 Problem Details body — no hand-rolled JSON here.
        group.MapGet("/{id:guid}", async (
                Guid id,
                GetClienteByIdQueryHandler handler,
                CancellationToken cancellationToken) =>
        {
            var dto = await handler.HandleAsync(new GetClienteByIdQuery(id), cancellationToken);
            return dto is null
                ? Results.NotFound()
                : Results.Ok(dto);
        });

        return app;
    }
}
