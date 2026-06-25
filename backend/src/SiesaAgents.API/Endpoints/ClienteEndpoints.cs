using FluentValidation;
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.Queries;

namespace SiesaAgents.API.Endpoints;

// Body-only record for PUT /api/v1/clientes/{id} — Id comes from route
internal record UpdateClienteBody(string Nombre, string Nit, string Telefono, string Ciudad);

public static class ClienteEndpoints
{
    public static void MapClienteEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/clientes", async (GetClientesQueryHandler handler) =>
        {
            var clientes = await handler.HandleAsync(new GetClientesQuery());
            return Results.Ok(clientes);
        })
        .WithName("GetClientes")
        .WithSummary("Obtiene todos los clientes")
        .Produces(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status500InternalServerError);

        app.MapGet("/api/v1/clientes/{id:guid}", async (Guid id, GetClienteByIdQueryHandler handler) =>
        {
            var cliente = await handler.HandleAsync(new GetClienteByIdQuery(id));

            if (cliente is null)
            {
                return Results.Problem(
                    detail: $"Cliente con id {id} no encontrado.",
                    title: "Not Found",
                    statusCode: StatusCodes.Status404NotFound,
                    type: "https://tools.ietf.org/html/rfc7807");
            }

            return Results.Ok(cliente);
        })
        .WithName("GetClienteById")
        .WithSummary("Obtiene un cliente por ID")
        .Produces(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .Produces(StatusCodes.Status500InternalServerError);

        app.MapPut("/api/v1/clientes/{id:guid}", async (
            Guid id,
            UpdateClienteBody body,
            UpdateClienteCommandHandler handler,
            IValidator<UpdateClienteCommand> validator) =>
        {
            var commandWithId = new UpdateClienteCommand(id, body.Nombre, body.Nit, body.Telefono, body.Ciudad);
            var validation = await validator.ValidateAsync(commandWithId);
            if (!validation.IsValid)
            {
                var errors = validation.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(
                        g => g.Key,
                        g => g.Select(e => e.ErrorMessage).ToArray());

                return Results.Problem(
                    detail: "One or more validation errors occurred.",
                    title: "Bad Request",
                    statusCode: StatusCodes.Status400BadRequest,
                    type: "https://tools.ietf.org/html/rfc7807",
                    extensions: new Dictionary<string, object?> { ["errors"] = errors });
            }

            var updated = await handler.HandleAsync(commandWithId);

            if (updated is null)
            {
                return Results.Problem(
                    detail: $"Cliente con id {id} no encontrado.",
                    title: "Not Found",
                    statusCode: StatusCodes.Status404NotFound,
                    type: "https://tools.ietf.org/html/rfc7807");
            }

            return Results.Ok(updated);
        })
        .WithName("UpdateCliente")
        .WithSummary("Actualiza un cliente existente")
        .Produces(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status404NotFound)
        .Produces(StatusCodes.Status409Conflict)
        .Produces(StatusCodes.Status500InternalServerError);

        app.MapDelete("/api/v1/clientes/{id:guid}", async (Guid id, DeleteClienteCommandHandler handler) =>
        {
            var deleted = await handler.HandleAsync(new DeleteClienteCommand(id));

            if (!deleted)
            {
                return Results.Problem(
                    detail: $"Cliente con id {id} no encontrado.",
                    title: "Not Found",
                    statusCode: StatusCodes.Status404NotFound,
                    type: "https://tools.ietf.org/html/rfc7807");
            }

            return Results.NoContent();
        })
        .WithName("DeleteCliente")
        .WithSummary("Elimina un cliente por ID")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .Produces(StatusCodes.Status500InternalServerError);

        app.MapPost("/api/v1/clientes", async (
            CreateClienteCommand command,
            CreateClienteCommandHandler handler,
            IValidator<CreateClienteCommand> validator) =>
        {
            var validation = await validator.ValidateAsync(command);
            if (!validation.IsValid)
            {
                var errors = validation.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(
                        g => g.Key,
                        g => g.Select(e => e.ErrorMessage).ToArray());

                return Results.Problem(
                    detail: "One or more validation errors occurred.",
                    title: "Bad Request",
                    statusCode: StatusCodes.Status400BadRequest,
                    type: "https://tools.ietf.org/html/rfc7807",
                    extensions: new Dictionary<string, object?> { ["errors"] = errors });
            }

            var created = await handler.HandleAsync(command);

            return Results.Created($"/api/v1/clientes/{created.Id}", created);
        })
        .WithName("CreateCliente")
        .WithSummary("Crea un nuevo cliente")
        .Produces(StatusCodes.Status201Created)
        .Produces(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status409Conflict)
        .Produces(StatusCodes.Status500InternalServerError);
    }
}
