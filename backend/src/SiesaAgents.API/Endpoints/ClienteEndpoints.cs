using SiesaAgents.Application.Clientes.Queries;

namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    public static WebApplication MapClienteEndpoints(this WebApplication app)
    {
        app.MapGet("/api/v1/clientes", async (GetClientesQueryHandler handler) =>
        {
            var result = await handler.HandleAsync(new GetClientesQuery());
            return Results.Ok(result);
        });

        app.MapGet("/api/v1/clientes/{id:guid}", async (Guid id, GetClienteByIdQueryHandler handler) =>
        {
            var result = await handler.HandleAsync(new GetClienteByIdQuery(id));
            if (result is null)
            {
                return Results.Problem(
                    statusCode: 404,
                    title: "Cliente no encontrado",
                    detail: "No existe un cliente con el ID especificado.");
            }
            return Results.Ok(result);
        });

        return app;
    }
}
