using SiesaAgents.Application.Clientes.Queries;

namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    public static void MapClienteEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/clientes", async (GetClientesQueryHandler handler) =>
        {
            var clientes = await handler.HandleAsync(new GetClientesQuery());
            return Results.Ok(clientes);
        })
        .WithName("GetClientes")
        .WithSummary("Obtiene todos los clientes")
        .Produces(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status500InternalServerError);

        app.MapGet("/api/v1/clientes/{id:guid}", async (Guid id, GetClienteByIdQueryHandler handler) =>
        {
            var cliente = await handler.HandleAsync(new GetClienteByIdQuery(id));

            if (cliente is null)
            {
                return Results.Problem(
                    detail: $"Cliente con id {id} no encontrado.",
                    title: "Not Found",
                    statusCode: StatusCodes.Status404NotFound,
                    type: "https://tools.ietf.org/html/rfc7807");
            }

            return Results.Ok(cliente);
        })
        .WithName("GetClienteById")
        .WithSummary("Obtiene un cliente por ID")
        .Produces(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .Produces(StatusCodes.Status500InternalServerError);
    }
}
