using Microsoft.AspNetCore.Mvc;
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    public static void MapClienteEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/clientes").WithTags("Clientes");

        group.MapGet("/", async (GetClientesQueryHandler handler, CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(new GetClientesQuery(), ct);
            return Results.Ok(result);
        })
        .WithName("GetClientes")
        .Produces<ClienteDto[]>(StatusCodes.Status200OK);

        group.MapGet("/{id:guid}", async (Guid id, GetClienteByIdQueryHandler handler, CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(new GetClienteByIdQuery(id), ct);
            if (result is null)
                return Results.Problem(
                    title: "Cliente no encontrado",
                    detail: $"No existe un cliente con id '{id}'.",
                    statusCode: StatusCodes.Status404NotFound);
            return Results.Ok(result);
        })
        .WithName("GetClienteById")
        .Produces<ClienteDto>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPost("/", async (CreateClienteCommand command, CreateClienteCommandHandler handler, CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(command, ct);
            return Results.Created($"/api/v1/clientes/{result.Id}", result);
        })
        .WithName("CreateCliente")
        .Produces<ClienteDto>(StatusCodes.Status201Created);

        group.MapDelete("/{id:guid}", async (Guid id, IClienteRepository repository, CancellationToken ct) =>
        {
            await repository.DeleteAsync(id, ct);
            return Results.NoContent();
        })
        .WithName("DeleteCliente")
        .Produces(StatusCodes.Status204NoContent);
    }
}
