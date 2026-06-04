using SiesaAgents.Application.Clientes.Queries;

namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    public static IEndpointRouteBuilder MapClienteEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/clientes");

        group.MapGet("/", async (GetClientesQueryHandler handler, CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(new GetClientesQuery(), ct);
            return Results.Ok(result);
        });

        group.MapGet("/{id:guid}", async (Guid id, GetClienteByIdQueryHandler handler, CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(new GetClienteByIdQuery(id), ct);
            return result is not null
                ? Results.Ok(result)
                : Results.Problem(
                    title: "Not Found",
                    detail: "El cliente no fue encontrado",
                    statusCode: StatusCodes.Status404NotFound);
        });

        return app;
    }
}
