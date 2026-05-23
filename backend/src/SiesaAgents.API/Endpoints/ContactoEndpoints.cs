using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using SiesaAgents.Application.Contactos.Commands;
using SiesaAgents.Application.Contactos.DTOs;
using SiesaAgents.Application.Contactos.Queries;
using SiesaAgents.Application.Contactos.Validators;

namespace SiesaAgents.API.Endpoints;

public static class ContactoEndpoints
{
    public static void MapContactoEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/contactos").WithTags("Contactos");

        group.MapGet("/", async (
            [FromQuery] Guid? clienteId,
            [FromQuery] bool? sinCliente,
            GetContactosQueryHandler allHandler,
            GetContactosByClienteIdQueryHandler byClienteHandler,
            GetOrphanContactosQueryHandler orphanHandler,
            CancellationToken ct) =>
        {
            if (sinCliente == true)
            {
                var result = await orphanHandler.HandleAsync(new GetOrphanContactosQuery(), ct);
                return Results.Ok(result);
            }
            if (clienteId.HasValue)
            {
                var result = await byClienteHandler.HandleAsync(new GetContactosByClienteIdQuery(clienteId.Value), ct);
                return Results.Ok(result);
            }
            {
                var result = await allHandler.HandleAsync(new GetContactosQuery(), ct);
                return Results.Ok(result);
            }
        })
        .WithName("GetContactos")
        .Produces<ContactoDto[]>(StatusCodes.Status200OK);

        group.MapGet("/{id:guid}", async (Guid id, GetContactoByIdQueryHandler handler, CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(new GetContactoByIdQuery(id), ct);
            return result is null
                ? Results.Problem(statusCode: 404, title: "Not Found", detail: $"Contacto con id '{id}' no encontrado.")
                : Results.Ok(result);
        })
        .WithName("GetContactoById")
        .Produces<ContactoDto>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPost("/", async (CreateContactoCommand command, CreateContactoCommandHandler handler, CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(command, ct);
            return Results.Created($"/api/v1/contactos/{result.Id}", result);
        })
        .WithName("CreateContacto")
        .Produces<ContactoDto>(StatusCodes.Status201Created)
        .ProducesValidationProblem();

        group.MapPut("/{id:guid}", async (
            Guid id,
            UpdateContactoCommand body,
            UpdateContactoCommandHandler handler,
            CancellationToken ct) =>
        {
            var command = body with { Id = id };
            var result = await handler.HandleAsync(command, ct);
            return Results.Ok(result);
        })
        .WithName("UpdateContacto")
        .Produces<ContactoDto>(StatusCodes.Status200OK)
        .ProducesValidationProblem()
        .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapDelete("/{id:guid}", async (
            Guid id,
            DeleteContactoCommandHandler handler,
            CancellationToken ct) =>
        {
            await handler.HandleAsync(new DeleteContactoCommand(id), ct);
            return Results.NoContent();
        })
        .WithName("DeleteContacto")
        .Produces(StatusCodes.Status204NoContent)
        .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPut("/{id:guid}/cliente", async (
            Guid id,
            AssignClienteToContactoRequest request,
            AssignClienteToContactoCommandHandler handler,
            IValidator<AssignClienteToContactoRequest> validator,
            CancellationToken ct) =>
        {
            var validation = await validator.ValidateAsync(request, ct);
            if (!validation.IsValid)
                return Results.ValidationProblem(validation.ToDictionary());

            var result = await handler.HandleAsync(
                new AssignClienteToContactoCommand(id, request.ClienteId), ct);
            return Results.Ok(result);
        })
        .WithName("AssignClienteToContacto")
        .Produces<ContactoDto>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesValidationProblem();
    }
}
