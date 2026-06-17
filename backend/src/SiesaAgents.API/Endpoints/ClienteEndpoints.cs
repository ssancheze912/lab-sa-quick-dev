using FluentValidation;
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Application.Clientes.Validators;

namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    public static WebApplication MapClienteEndpoints(this WebApplication app)
    {
        app.MapGet("/api/v1/clientes", async (GetClientesQueryHandler handler) =>
        {
            var result = await handler.HandleAsync(new GetClientesQuery());
            return Results.Ok(result);
        });

        app.MapGet("/api/v1/clientes/{id:guid}", async (Guid id, GetClienteByIdQueryHandler handler) =>
        {
            var result = await handler.HandleAsync(new GetClienteByIdQuery(id));
            if (result is null)
            {
                return Results.Problem(
                    statusCode: 404,
                    title: "Cliente no encontrado",
                    detail: "No existe un cliente con el ID especificado.");
            }
            return Results.Ok(result);
        });

        app.MapPost("/api/v1/clientes", async (
            CreateClienteRequest request,
            CreateClienteRequestValidator validator,
            CreateClienteCommandHandler handler) =>
        {
            var validationResult = await validator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                return Results.ValidationProblem(validationResult.ToDictionary());
            }

            var command = new CreateClienteCommand(
                request.Nombre,
                request.NitRuc,
                request.Telefono,
                request.Ciudad
            );
            var result = await handler.HandleAsync(command);
            return Results.Created($"/api/v1/clientes/{result.Id}", result);
        });

        app.MapPut("/api/v1/clientes/{id:guid}", async (
            Guid id,
            UpdateClienteCommand body,
            UpdateClienteCommandHandler handler,
            IValidator<UpdateClienteCommand> validator) =>
        {
            var command = body with { Id = id };
            var validationResult = await validator.ValidateAsync(command);
            if (!validationResult.IsValid)
                return Results.ValidationProblem(validationResult.ToDictionary());

            var result = await handler.HandleAsync(command);
            if (result is null)
                return Results.Problem(
                    statusCode: 404,
                    title: "Cliente no encontrado",
                    detail: "No existe un cliente con el ID especificado.");

            return Results.Ok(result);
        });

        return app;
    }
}
