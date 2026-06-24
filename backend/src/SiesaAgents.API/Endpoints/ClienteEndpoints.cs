using FluentValidation;
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;

namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    public static void MapClienteEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/clientes", async (GetClientesQueryHandler handler, CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(new GetClientesQuery(), ct);
            return Results.Ok(result);
        })
        .WithName("GetClientes")
        .WithSummary("List all clients");

        app.MapGet("/api/v1/clientes/{id:guid}", async (Guid id, GetClienteByIdQueryHandler handler, CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(new GetClienteByIdQuery(id), ct);
            return Results.Ok(result);
        })
        .WithName("GetClienteById")
        .WithSummary("Get client by ID");

        app.MapPost("/api/v1/clientes", async (
            CreateClienteRequest request,
            IValidator<CreateClienteRequest> validator,
            CreateClienteCommandHandler handler,
            CancellationToken ct) =>
        {
            var validation = await validator.ValidateAsync(request, ct);
            if (!validation.IsValid)
            {
                return Results.ValidationProblem(validation.ToDictionary());
            }

            var command = new CreateClienteCommand(request.Nombre, request.Nit, request.Telefono, request.Ciudad);
            var result = await handler.HandleAsync(command, ct);
            return Results.Created($"/api/v1/clientes/{result.Id}", result);
        })
        .WithName("CreateCliente")
        .WithSummary("Create a new client");
    }
}
