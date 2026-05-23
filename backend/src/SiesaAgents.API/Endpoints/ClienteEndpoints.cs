using SiesaAgents.Application.Clientes.Queries;
using Microsoft.AspNetCore.Mvc;

namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    public static IEndpointRouteBuilder MapClienteEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/clientes");

        group.MapGet("/", async (
            [FromServices] GetClientesQueryHandler handler,
            CancellationToken ct) =>
        {
            var dtos = await handler.HandleAsync(new GetClientesQuery(), ct);
            return Results.Ok(dtos);
        });

        return app;
    }
}
