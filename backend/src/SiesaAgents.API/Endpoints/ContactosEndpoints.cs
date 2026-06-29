using Microsoft.AspNetCore.Mvc;
using SiesaAgents.Application.Contactos.Commands;
using SiesaAgents.Application.Contactos.DTOs;
using SiesaAgents.Application.Contactos.Queries;
using SiesaAgents.Application.Contactos.Validators;

namespace SiesaAgents.API.Endpoints;

public static class ContactosEndpoints
{
    public static IEndpointRouteBuilder MapContactosEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/contactos", async (IGetContactosQueryHandler handler) =>
        {
            var contactos = await handler.HandleAsync(new GetContactosQuery());
            return Results.Ok(contactos);
        })
        .WithName("GetContactos")
        .WithSummary("Get all contacts");

        app.MapGet("/api/v1/contactos/{id:guid}", async (Guid id, IGetContactoByIdQueryHandler handler, CancellationToken ct) =>
        {
            var contacto = await handler.HandleAsync(new GetContactoByIdQuery(id), ct);

            if (contacto is null)
            {
                var problem = new ProblemDetails
                {
                    Status = StatusCodes.Status404NotFound,
                    Title = "Contacto no encontrado",
                    Detail = $"No existe un contacto con id '{id}'."
                };
                return Results.Json(problem, statusCode: StatusCodes.Status404NotFound, contentType: "application/problem+json");
            }

            return Results.Ok(contacto);
        })
        .WithName("GetContactoById")
        .WithSummary("Get contact by ID");

        // Catch-all for invalid UUID format — returns 400 Bad Request
        app.MapGet("/api/v1/contactos/{id}", (string id) =>
        {
            var problem = new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Bad Request",
                Detail = $"El parámetro 'id' no es un UUID válido: '{id}'."
            };
            return Results.Json(problem, statusCode: StatusCodes.Status400BadRequest, contentType: "application/problem+json");
        })
        .WithName("GetContactoByIdInvalid")
        .WithSummary("Invalid contact ID format");

        app.MapPost("/api/v1/contactos", async (CreateContactoCommand command, ICreateContactoCommandHandler handler, CancellationToken ct) =>
        {
            var validator = new CreateContactoRequestValidator();
            var validationResult = await validator.ValidateAsync(command, ct);

            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors
                    .GroupBy(e => e.PropertyName, StringComparer.OrdinalIgnoreCase)
                    .ToDictionary(
                        g => char.ToLowerInvariant(g.Key[0]) + g.Key[1..],
                        g => g.Select(e => e.ErrorMessage).ToArray()
                    );

                var validationProblem = new
                {
                    status = StatusCodes.Status400BadRequest,
                    title = "Validation Error",
                    errors
                };

                return Results.Json(validationProblem, statusCode: StatusCodes.Status400BadRequest, contentType: "application/problem+json");
            }

            var dto = await handler.HandleAsync(command, ct);

            return Results.Created($"/api/v1/contactos/{dto.Id}", dto);
        })
        .WithName("CreateContacto")
        .WithSummary("Create a new contact");

        app.MapPut("/api/v1/contactos/{id:guid}", async (Guid id, UpdateContactoRequest body, IUpdateContactoCommandHandler handler, CancellationToken ct) =>
        {
            var command = new UpdateContactoCommand(
                id,
                body.Nombre ?? string.Empty,
                body.Cargo ?? string.Empty,
                body.Telefono ?? string.Empty,
                body.Email ?? string.Empty
            );

            var validator = new UpdateContactoRequestValidator();
            var validationResult = await validator.ValidateAsync(command, ct);

            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors
                    .GroupBy(e => e.PropertyName, StringComparer.OrdinalIgnoreCase)
                    .ToDictionary(
                        g => char.ToLowerInvariant(g.Key[0]) + g.Key[1..],
                        g => g.Select(e => e.ErrorMessage).ToArray()
                    );

                var validationProblem = new
                {
                    status = StatusCodes.Status400BadRequest,
                    title = "Validation Error",
                    errors
                };

                return Results.Json(validationProblem, statusCode: StatusCodes.Status400BadRequest, contentType: "application/problem+json");
            }

            var dto = await handler.HandleAsync(command, ct);

            if (dto is null)
            {
                var problem = new ProblemDetails
                {
                    Status = StatusCodes.Status404NotFound,
                    Title = "Not Found",
                    Detail = $"Contacto con id '{id}' no encontrado."
                };
                return Results.Json(problem, statusCode: StatusCodes.Status404NotFound, contentType: "application/problem+json");
            }

            return Results.Ok(dto);
        })
        .WithName("UpdateContacto")
        .WithSummary("Update an existing contact");

        return app;
    }
}
