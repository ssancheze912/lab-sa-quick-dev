using SiesaAgents.Application.Clientes.Queries;

namespace SiesaAgents.API.Endpoints;

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
        .WithTags("Clientes");

        app.MapGet("/api/v1/clientes/{id:guid}", async (
            Guid id,
            GetClienteByIdQueryHandler handler,
            CancellationToken ct) =>
        {
            var dto = await handler.HandleAsync(new GetClienteByIdQuery(id), ct);
            return dto is null
                ? Results.Problem(title: "Cliente no encontrado", statusCode: 404)
                : Results.Ok(dto);
        })
        .WithTags("Clientes");

        return app;
    }
}
