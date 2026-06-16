using Microsoft.AspNetCore.Mvc;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;

namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    public static IEndpointRouteBuilder MapClienteEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/clientes", async (
            IGetClientesQueryHandler handler,
            CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(new GetClientesQuery(), ct);
            return Results.Ok(result);
        })
        .WithName("GetClientes")
        .Produces<IReadOnlyList<ClienteDto>>(200);

        app.MapGet("/api/v1/clientes/{id:guid}", async (
            Guid id,
            IGetClienteByIdQueryHandler handler,
            CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(new GetClienteByIdQuery(id), ct);
            if (result is null)
                return Results.Problem(
                    detail: "No se encontró el cliente solicitado.",
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Cliente no encontrado");

            return Results.Ok(result);
        })
        .WithName("GetClienteById")
        .Produces<ClienteDto>(200)
        .Produces<ProblemDetails>(404);

        return app;
    }
}
