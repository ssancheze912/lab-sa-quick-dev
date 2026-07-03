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

        return app;
    }
}
