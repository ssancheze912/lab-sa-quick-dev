using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;

namespace SiesaAgents.API.Endpoints;

/// <summary>
/// Minimal API endpoints for the <c>/api/v1/clientes</c> resource.
/// Story 2.1 exposes <c>GET /</c>; Story 2.2 adds <c>GET /{id:guid}</c>;
/// Story 2.3 adds <c>POST /</c>; Story 2.4 adds <c>PUT /{id:guid}</c>.
/// DELETE arrives in Story 2.5.
/// </summary>
public static class ClienteEndpoints
{
    public static IEndpointRouteBuilder MapClienteEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/v1/clientes").WithTags("Clientes");

        group.MapGet("/", async (GetClientesQueryHandler handler, CancellationToken ct) =>
                Results.Ok(await handler.HandleAsync(new GetClientesQuery(), ct)))
             .WithName("GetClientes")
             .Produces<IReadOnlyList<ClienteDto>>(StatusCodes.Status200OK);

        // Story 2.2 — GET /api/v1/clientes/{id:guid}. The :guid route constraint
        // (AC #10) short-circuits any non-UUID path segment with a 404 from
        // routing itself, so the handler never sees malformed input. When the
        // handler returns null (no match), Results.NotFound() writes an empty
        // 404 body which UseStatusCodePages (Program.cs) rewrites into a
        // Problem Details RFC 7807 payload.
        group.MapGet("/{id:guid}", async (Guid id, GetClienteByIdQueryHandler handler, CancellationToken ct) =>
                {
                    var dto = await handler.HandleAsync(new GetClienteByIdQuery(id), ct);
                    return dto is null ? Results.NotFound() : Results.Ok(dto);
                })
             .WithName("GetClienteById")
             .Produces<ClienteDto>(StatusCodes.Status200OK)
             .Produces(StatusCodes.Status404NotFound);

        // Story 2.3 — POST /api/v1/clientes.
        // ValidationEndpointFilter runs BEFORE the handler; a 400 short-circuits
        // the handler entirely (RFC 7807 body via Results.ValidationProblem).
        // On 409 (duplicate NIT) the handler throws ClienteNitConflictException
        // and the ExceptionHandlingMiddleware translates it to Problem Details.
        group.MapPost("/", async (
                CreateClienteRequest request,
                CreateClienteCommandHandler handler,
                CancellationToken ct) =>
            {
                var dto = await handler.HandleAsync(new CreateClienteCommand(request), ct);
                return Results.Created($"/api/v1/clientes/{dto.Id}", dto);
            })
            .AddEndpointFilter<ValidationEndpointFilter<CreateClienteRequest>>()
            .WithName("CreateCliente")
            .Produces<ClienteDto>(StatusCodes.Status201Created)
            .ProducesValidationProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status409Conflict);

        // Story 2.4 — PUT /api/v1/clientes/{id:guid}.
        // The generic ValidationEndpointFilter<UpdateClienteRequest> (Story 2.3)
        // runs BEFORE the handler; a 400 short-circuits. On 409 the handler
        // throws ClienteNitConflictException and the ExceptionHandlingMiddleware
        // translates it to Problem Details. On 404 the handler returns null and
        // the endpoint calls Results.NotFound() (UseStatusCodePages rewrites the
        // empty body into RFC 7807). The :guid constraint short-circuits any
        // non-UUID path with 404 from routing itself.
        group.MapPut("/{id:guid}", async (
                Guid id,
                UpdateClienteRequest request,
                UpdateClienteCommandHandler handler,
                CancellationToken ct) =>
            {
                var dto = await handler.HandleAsync(new UpdateClienteCommand(id, request), ct);
                return dto is null ? Results.NotFound() : Results.Ok(dto);
            })
            .AddEndpointFilter<ValidationEndpointFilter<UpdateClienteRequest>>()
            .WithName("UpdateCliente")
            .Produces<ClienteDto>(StatusCodes.Status200OK)
            .ProducesValidationProblem(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict);

        return routes;
    }
}
