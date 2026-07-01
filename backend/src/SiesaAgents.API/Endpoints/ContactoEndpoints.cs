using SiesaAgents.Application.Commands.Contactos;
using SiesaAgents.Application.Queries.Contactos;
using SiesaAgents.Application.Validators;

namespace SiesaAgents.API.Endpoints;

public static class ContactoEndpoints
{
    public static IEndpointRouteBuilder MapContactoEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/contactos", async (
                string? q,
                GetContactosQueryHandler handler,
                CancellationToken ct) =>
            {
                var result = await handler.HandleAsync(new GetContactosQuery(q), ct);
                return Results.Ok(result);
            })
            .WithName("GetContactos")
            .WithTags("Contactos");

        app.MapGet("/api/v1/contactos/{id:guid}", async (
                Guid id,
                GetContactoByIdQueryHandler handler,
                CancellationToken ct) =>
            {
                var result = await handler.HandleAsync(new GetContactoByIdQuery(id), ct);
                return result is null ? Results.NotFound() : Results.Ok(result);
            })
            .WithName("GetContactoById")
            .WithTags("Contactos");

        app.MapPost("/api/v1/contactos", async (
                CreateContactoCommand command,
                CreateContactoCommandHandler handler,
                CancellationToken ct) =>
            {
                var validator = new CreateContactoRequestValidator();
                var validationResult = validator.Validate(command);
                if (!validationResult.IsValid)
                {
                    return Results.ValidationProblem(validationResult.ToDictionary());
                }

                var created = await handler.HandleAsync(command, ct);
                return Results.Created($"/api/v1/contactos/{created.Id}", created);
            })
            .WithName("CreateContacto")
            .WithTags("Contactos");

        return app;
    }
}
