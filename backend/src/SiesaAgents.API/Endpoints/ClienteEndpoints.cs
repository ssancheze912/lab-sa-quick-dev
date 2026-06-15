using SiesaAgents.Application.Clientes.DTOs;
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
    }
}
