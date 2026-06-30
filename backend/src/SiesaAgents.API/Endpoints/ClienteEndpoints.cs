using SiesaAgents.Application.Clientes.Commands;
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
            return dto is not null
                ? Results.Ok(dto)
                : Results.Problem(
                    detail: "The requested resource does not exist.",
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Not Found",
                    type: "https://tools.ietf.org/html/rfc9110#section-15.5.5");
        })
            .WithName("GetClienteById")
            .WithTags("Clientes")
            .Produces<ClienteDto>()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithOpenApi();

        app.MapPost("/api/v1/clientes", async (CreateClienteCommand command, CreateClienteCommandHandler handler, CancellationToken ct) =>
        {
            var dto = await handler.Handle(command, ct);
            return Results.Created($"/api/v1/clientes/{dto.Id}", dto);
        })
            .WithName("CreateCliente")
            .WithTags("Clientes")
            .Produces<ClienteDto>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithOpenApi();

        app.MapPut("/api/v1/clientes/{id:guid}", async (Guid id, UpdateClienteCommand request, UpdateClienteCommandHandler handler, CancellationToken ct) =>
        {
            var command = request with { Id = id };
            var dto = await handler.Handle(command, ct);
            return Results.Ok(dto);
        })
            .WithName("UpdateCliente")
            .WithTags("Clientes")
            .Produces<ClienteDto>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithOpenApi();

        app.MapDelete("/api/v1/clientes/{id:guid}", async (Guid id, DeleteClienteCommandHandler handler, CancellationToken ct) =>
        {
            await handler.Handle(new DeleteClienteCommand(id), ct);
            return Results.NoContent();
        })
            .WithName("DeleteCliente")
            .WithTags("Clientes")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithOpenApi();
    }
}
