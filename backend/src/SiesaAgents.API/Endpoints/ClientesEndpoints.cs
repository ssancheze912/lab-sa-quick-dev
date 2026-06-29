using Microsoft.AspNetCore.Mvc;
using SiesaAgents.Application.Clientes.Queries;

namespace SiesaAgents.API.Endpoints;

public static class ClientesEndpoints
{
    public static IEndpointRouteBuilder MapClientesEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/clientes", async (IGetClientesQueryHandler handler) =>
        {
            var clientes = await handler.HandleAsync(new GetClientesQuery());
            return Results.Ok(clientes);
        })
        .WithName("GetClientes")
        .WithSummary("Get all clients");

        app.MapGet("/api/v1/clientes/{id:guid}", async (Guid id, IGetClienteByIdQueryHandler handler) =>
        {
            var cliente = await handler.HandleAsync(new GetClienteByIdQuery(id));

            if (cliente is null)
            {
                var problem = new ProblemDetails
                {
                    Status = StatusCodes.Status404NotFound,
                    Title = "Not Found",
                    Detail = $"Cliente con ID {id} no encontrado."
                };
                return Results.Json(problem, statusCode: StatusCodes.Status404NotFound, contentType: "application/problem+json");
            }

            return Results.Ok(cliente);
        })
        .WithName("GetClienteById")
        .WithSummary("Get client by ID");

        return app;
    }
}
