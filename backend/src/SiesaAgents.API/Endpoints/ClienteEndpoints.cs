using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;

namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    public static WebApplication MapClienteEndpoints(this WebApplication app)
    {
        app.MapGet("/api/v1/clientes", async (GetClientesQueryHandler handler, CancellationToken ct) =>
            Results.Ok(await handler.HandleAsync(new GetClientesQuery(), ct)))
            .WithName("GetClientes")
            .Produces<IReadOnlyList<ClienteDto>>(StatusCodes.Status200OK);

        app.MapPost("/api/v1/clientes", async (CreateClienteCommand command, CreateClienteCommandHandler handler, CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(command, ct);
            return Results.Created($"/api/v1/clientes/{result.Id}", result);
        })
            .WithName("CreateCliente")
            .Produces<ClienteDto>(StatusCodes.Status201Created);

        return app;
    }
}
