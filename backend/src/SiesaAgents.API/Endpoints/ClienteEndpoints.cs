using FluentValidation;
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Exceptions;
using SiesaAgents.Application.Clientes.Queries;

namespace SiesaAgents.API.Endpoints;

/// <summary>
/// Minimal API endpoint group for the <c>clientes</c> aggregate. Only the
/// list endpoint lands in Story 2.1; future stories append CRUD endpoints
/// to the same group.
/// </summary>
public static class ClienteEndpoints
{
    public static void MapClienteEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/clientes").WithTags("Clientes");

        group.MapGet("/", async (GetClientesQueryHandler handler, CancellationToken ct) =>
                Results.Ok(await handler.Handle(new GetClientesQuery(), ct)))
            .WithName("GetClientes")
            .Produces<IReadOnlyList<ClienteDto>>(StatusCodes.Status200OK);

        // POST /api/v1/clientes — Story 2.3. FluentValidation guards the body
        // shape (returns 400 Problem Details with `errors` member on failure).
        // Duplicate NIT triggers `DuplicateNitException` from the handler which
        // is caught inline and translated to a 409 Problem Details body.
        group.MapPost("/", async (
            CreateClienteCommand command,
            IValidator<CreateClienteCommand> validator,
            CreateClienteCommandHandler handler,
            CancellationToken ct) =>
        {
            var validation = await validator.ValidateAsync(command, ct);
            if (!validation.IsValid)
            {
                var errors = validation.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
                return Results.ValidationProblem(errors);
            }

            try
            {
                var dto = await handler.Handle(command, ct);
                return Results.Created($"/api/v1/clientes/{dto.Id}", dto);
            }
            catch (DuplicateNitException)
            {
                return Results.Problem(
                    title: "El NIT/RUC ya está registrado.",
                    statusCode: StatusCodes.Status409Conflict,
                    type: "https://tools.ietf.org/html/rfc7231#section-6.5.8",
                    instance: "/api/v1/clientes");
            }
        })
        .WithName("CreateCliente")
        .Accepts<CreateClienteCommand>("application/json")
        .Produces<ClienteDto>(StatusCodes.Status201Created)
        .ProducesValidationProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status409Conflict);

        // GET /api/v1/clientes/{id:guid} — Story 2.2. The route constraint
        // `{id:guid}` ensures the handler only runs for syntactically valid
        // UUIDs; non-UUID values are caught by the sibling fallback route
        // below which emits a 400 Problem Details.
        group.MapGet("/{id:guid}", async (Guid id, GetClienteByIdQueryHandler handler, CancellationToken ct) =>
        {
            var dto = await handler.Handle(new GetClienteByIdQuery(id), ct);
            return dto is null
                ? Results.Problem(
                    title: "Cliente no encontrado.",
                    statusCode: StatusCodes.Status404NotFound,
                    type: "https://tools.ietf.org/html/rfc7231#section-6.5.4",
                    instance: $"/api/v1/clientes/{id}")
                : Results.Ok(dto);
        })
        .WithName("GetClienteById")
        .Produces<ClienteDto>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status404NotFound);

        // PUT /api/v1/clientes/{id:guid} — Story 2.4. FluentValidation guards
        // the body shape (400 Problem Details on failure). Duplicate NIT against
        // ANOTHER cliente triggers `DuplicateNitException` (409 Problem Details).
        // Unknown id returns 404 Problem Details. The route id ALWAYS wins over
        // the body's Id field as a defense-in-depth measure.
        group.MapPut("/{id:guid}", async (
            Guid id,
            UpdateClienteCommand body,
            IValidator<UpdateClienteCommand> validator,
            UpdateClienteCommandHandler handler,
            CancellationToken ct) =>
        {
            // Route id is the source of truth — overwrite the body's Id field
            // so a malformed body cannot redirect the update to a different cliente.
            var command = body with { Id = id };

            var validation = await validator.ValidateAsync(command, ct);
            if (!validation.IsValid)
            {
                var errors = validation.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
                return Results.ValidationProblem(errors);
            }

            try
            {
                var dto = await handler.Handle(command, ct);
                return dto is null
                    ? Results.Problem(
                        title: "Cliente no encontrado.",
                        statusCode: StatusCodes.Status404NotFound,
                        type: "https://tools.ietf.org/html/rfc7231#section-6.5.4",
                        instance: $"/api/v1/clientes/{id}")
                    : Results.Ok(dto);
            }
            catch (DuplicateNitException)
            {
                return Results.Problem(
                    title: "El NIT/RUC ya está registrado.",
                    statusCode: StatusCodes.Status409Conflict,
                    type: "https://tools.ietf.org/html/rfc7231#section-6.5.8",
                    instance: $"/api/v1/clientes/{id}");
            }
        })
        .WithName("UpdateCliente")
        .Accepts<UpdateClienteCommand>("application/json")
        .Produces<ClienteDto>(StatusCodes.Status200OK)
        .ProducesValidationProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);

        // Catch-all for non-UUID segments inside the clientes group so AC #8 is
        // honored: invalid UUIDs return 400 Problem Details, NOT a 404 from the
        // global fallback. Registered AFTER the `{id:guid}` route so the
        // constrained route still wins for syntactically valid UUIDs.
        group.MapGet("/{id}", (string id) =>
            Results.Problem(
                title: "Identificador de cliente inválido.",
                detail: "El identificador debe ser un UUID válido.",
                statusCode: StatusCodes.Status400BadRequest,
                type: "https://tools.ietf.org/html/rfc7231#section-6.5.1",
                instance: $"/api/v1/clientes/{id}"))
            .WithName("GetClienteByIdInvalid")
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ExcludeFromDescription();

        // Sibling catch-all for PUT — Story 2.4 AC #13. Non-UUID segments to PUT
        // must return 400 Problem Details (otherwise MapFallback would 404 them).
        group.MapPut("/{id}", (string id) =>
            Results.Problem(
                title: "Identificador de cliente inválido.",
                detail: "El identificador debe ser un UUID válido.",
                statusCode: StatusCodes.Status400BadRequest,
                type: "https://tools.ietf.org/html/rfc7231#section-6.5.1",
                instance: $"/api/v1/clientes/{id}"))
            .WithName("UpdateClienteInvalid")
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ExcludeFromDescription();
    }
}
