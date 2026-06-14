using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    public static WebApplication MapClienteEndpoints(this WebApplication app)
    {
        app.MapGet("/api/v1/clientes", async (GetClientesQueryHandler handler, CancellationToken ct) =>
        {
            var dtos = await handler.HandleAsync(new GetClientesQuery(), ct);
            return Results.Ok(dtos);
        });

        app.MapGet("/api/v1/clientes/{id:guid}", async (Guid id, GetClienteByIdQueryHandler handler, CancellationToken ct) =>
        {
            var dto = await handler.HandleAsync(new GetClienteByIdQuery(id), ct);
            if (dto is null)
                return Results.Problem(
                    detail: "El cliente solicitado no existe.",
                    statusCode: 404,
                    title: "Cliente no encontrado."
                );
            return Results.Ok(dto);
        });

        return app;
    }
}
