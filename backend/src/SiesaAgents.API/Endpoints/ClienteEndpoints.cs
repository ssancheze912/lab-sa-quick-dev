using SiesaAgents.Application.Clientes.Queries;

namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    public static IEndpointRouteBuilder MapClienteEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/clientes", async (GetClientesQueryHandler handler, CancellationToken ct) =>
            Results.Ok(await handler.Handle(new GetClientesQuery(), ct)));

        app.MapGet("/api/v1/clientes/{id:guid}", async (
            Guid id,
            GetClienteByIdQueryHandler handler,
            CancellationToken ct) =>
        {
            var result = await handler.Handle(new GetClienteByIdQuery(id), ct);
            return result is null
                ? Results.Problem(
                    statusCode: 404,
                    title: "Cliente no encontrado",
                    detail: $"No existe un cliente con ID {id}.")
                : Results.Ok(result);
        });

        return app;
    }
}
