using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;

namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    public static void MapClienteEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/clientes");

        group.MapGet("/", async (GetClientesQueryHandler handler, CancellationToken cancellationToken) =>
        {
            var clientes = await handler.Handle(new GetClientesQuery(), cancellationToken);
            return Results.Ok(clientes);
        });

        group.MapGet("/{id:guid}", async (Guid id, GetClienteByIdQueryHandler handler, CancellationToken cancellationToken) =>
        {
            var cliente = await handler.Handle(new GetClienteByIdQuery(id), cancellationToken);
            return cliente is null ? Results.NotFound() : Results.Ok(cliente);
        });

        group.MapPost("/", async (
            CreateClienteRequest request,
            IValidator<CreateClienteRequest> validator,
            CreateClienteCommandHandler handler,
            CancellationToken cancellationToken) =>
        {
            var validation = await validator.ValidateAsync(request, cancellationToken);
            if (!validation.IsValid)
            {
                return Results.ValidationProblem(validation.ToDictionary());
            }

            var result = await handler.Handle(
                new CreateClienteCommand(request.Nombre, request.Nit, request.Telefono, request.Ciudad),
                cancellationToken);

            if (result.IsConflict)
            {
                return Results.Conflict(new ProblemDetails
                {
                    Status = StatusCodes.Status409Conflict,
                    Title = "Conflict",
                    Detail = "El NIT/RUC ya está registrado.",
                });
            }

            return Results.Created($"/api/v1/clientes/{result.Cliente!.Id}", result.Cliente);
        });

        group.MapPut("/{id:guid}", async (
            Guid id,
            UpdateClienteRequest request,
            IValidator<UpdateClienteRequest> validator,
            UpdateClienteCommandHandler handler,
            CancellationToken cancellationToken) =>
        {
            var validation = await validator.ValidateAsync(request, cancellationToken);
            if (!validation.IsValid)
            {
                return Results.ValidationProblem(validation.ToDictionary());
            }

            var result = await handler.Handle(
                new UpdateClienteCommand(id, request.Nombre, request.Nit, request.Telefono, request.Ciudad),
                cancellationToken);

            if (result.IsNotFound)
            {
                return Results.NotFound();
            }

            if (result.IsConflict)
            {
                return Results.Conflict(new ProblemDetails
                {
                    Status = StatusCodes.Status409Conflict,
                    Title = "Conflict",
                    Detail = "El NIT/RUC ya está registrado.",
                });
            }

            return Results.Ok(result.Cliente);
        });

        group.MapDelete("/{id:guid}", async (
            Guid id,
            DeleteClienteCommandHandler handler,
            CancellationToken cancellationToken) =>
        {
            var deleted = await handler.Handle(new DeleteClienteCommand(id), cancellationToken);
            return deleted ? Results.NoContent() : Results.NotFound();
        });
    }
}
