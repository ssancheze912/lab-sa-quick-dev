using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.Queries;

namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    public static RouteGroupBuilder MapClienteEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/clientes", async (GetClientesQueryHandler handler) =>
        {
            var result = await handler.HandleAsync(new GetClientesQuery());
            return Results.Ok(result);
        })
        .WithName("GetClientes")
        .WithTags("Clientes")
        .Produces(StatusCodes.Status200OK);

        group.MapPost("/clientes", async (CreateClienteRequest request, CreateClienteCommandHandler handler) =>
        {
            var command = new CreateClienteCommand(request.Nombre, request.Nit, request.Telefono ?? string.Empty, request.Ciudad ?? string.Empty);
            var result = await handler.HandleAsync(command);
            return Results.Created($"/api/v1/clientes/{result.Id}", result);
        })
        .WithName("CreateCliente")
        .WithTags("Clientes")
        .Produces(StatusCodes.Status201Created);

        group.MapDelete("/clientes/{id:guid}", async (Guid id, DeleteClienteCommandHandler handler) =>
        {
            await handler.HandleAsync(new DeleteClienteCommand(id));
            return Results.NoContent();
        })
        .WithName("DeleteCliente")
        .WithTags("Clientes")
        .Produces(StatusCodes.Status204NoContent);

        return group;
    }
}

public record CreateClienteRequest(string Nombre, string Nit, string? Telefono, string? Ciudad);
