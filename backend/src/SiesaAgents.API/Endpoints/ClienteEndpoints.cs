using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;

namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    public static void MapClienteEndpoints(this WebApplication app)
    {
        app.MapGet("/api/v1/clientes", async (GetClientesQueryHandler handler, CancellationToken ct) =>
            Results.Ok(await handler.Handle(new GetClientesQuery(), ct)))
            .WithName("GetClientes")
            .WithTags("Clientes")
            .Produces<IEnumerable<ClienteDto>>()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithOpenApi();

        app.MapGet("/api/v1/clientes/{id:guid}", async (Guid id, GetClienteByIdQueryHandler handler, CancellationToken ct) =>
        {
            var dto = await handler.Handle(new GetClienteByIdQuery(id), ct);
            return dto is not null ? Results.Ok(dto) : Results.NotFound();
        })
            .WithName("GetClienteById")
            .WithTags("Clientes")
            .Produces<ClienteDto>()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithOpenApi();
    }
}
