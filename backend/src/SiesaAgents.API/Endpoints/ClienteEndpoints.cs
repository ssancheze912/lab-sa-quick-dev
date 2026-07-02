using FluentValidation;
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Exceptions;

namespace SiesaAgents.API.Endpoints;

/// <summary>
/// Minimal API endpoints for the Cliente aggregate. Story 2.1 exposes GET /api/v1/clientes;
/// write endpoints land in Stories 2.3–2.5.
/// </summary>
public static class ClienteEndpoints
{
    public static IEndpointRouteBuilder MapClienteEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/clientes").WithTags("Clientes");

        group.MapGet("/", async (GetClientesQueryHandler handler, CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(new GetClientesQuery(), ct);
            return Results.Ok(result);
        })
        .WithName("GetClientes");

        // Story 2.2 — Cliente detail. The {id:guid} route constraint refuses
        // to bind non-GUID segments (framework emits a 4xx Problem Details for
        // those), so the handler is only invoked for real GUIDs.
        group.MapGet("/{id:guid}", async (
            Guid id,
            GetClienteByIdQueryHandler handler,
            HttpContext http,
            CancellationToken ct) =>
        {
            var dto = await handler.HandleAsync(new GetClienteByIdQuery(id), ct);
            if (dto is null)
            {
                return Results.Problem(
                    title: "Cliente no encontrado",
                    detail: $"No existe ningún cliente con id {id}.",
                    statusCode: StatusCodes.Status404NotFound,
                    type: "https://tools.ietf.org/html/rfc9110#section-15.5.5",
                    instance: http.Request.Path);
            }

            return Results.Ok(dto);
        })
        .WithName("GetClienteById");

        // Story 2.3 — Create cliente. 201 on success, 400 on validation failure
        // (FluentValidation runs BEFORE EF Core), 409 on uk_clientes_nit conflict.
        group.MapPost("/", async (
            CreateClienteRequest request,
            IValidator<CreateClienteRequest> validator,
            CreateClienteCommandHandler handler,
            HttpContext http,
            CancellationToken ct) =>
        {
            var validation = await validator.ValidateAsync(request, ct);
            if (!validation.IsValid)
            {
                var errors = validation.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(
                        g => System.Text.Json.JsonNamingPolicy.CamelCase.ConvertName(g.Key),
                        g => g.Select(e => e.ErrorMessage).ToArray());

                return Results.ValidationProblem(
                    errors,
                    title: "Uno o más campos son inválidos.",
                    statusCode: StatusCodes.Status400BadRequest,
                    type: "https://tools.ietf.org/html/rfc9110#section-15.5.1",
                    instance: http.Request.Path);
            }

            try
            {
                var command = new CreateClienteCommand(
                    request.Nombre,
                    request.Nit,
                    request.Telefono,
                    request.Ciudad);

                var dto = await handler.HandleAsync(command, ct);

                // 201 Created + Location header — aligns with architecture doc:
                // "POST -> 201 Created + created object".
                return Results.Created($"/api/v1/clientes/{dto.Id}", dto);
            }
            catch (DuplicateNitException)
            {
                return Results.Problem(
                    title: "NIT/RUC duplicado",
                    detail: "Ya existe un cliente con el NIT/RUC indicado.",
                    statusCode: StatusCodes.Status409Conflict,
                    type: "https://tools.ietf.org/html/rfc9110#section-15.5.10",
                    instance: http.Request.Path,
                    extensions: new Dictionary<string, object?> { ["field"] = "nit" });
            }
        })
        .WithName("CreateCliente");

        // Story 2.4 — Update cliente. 200 on success, 400 on validation, 404 when
        // the id does not exist, 409 on uk_clientes_nit conflict against a DIFFERENT
        // cliente row.
        group.MapPut("/{id:guid}", async (
            Guid id,
            UpdateClienteRequest request,
            IValidator<UpdateClienteRequest> validator,
            UpdateClienteCommandHandler handler,
            HttpContext http,
            CancellationToken ct) =>
        {
            var validation = await validator.ValidateAsync(request, ct);
            if (!validation.IsValid)
            {
                var errors = validation.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(
                        g => System.Text.Json.JsonNamingPolicy.CamelCase.ConvertName(g.Key),
                        g => g.Select(e => e.ErrorMessage).ToArray());

                return Results.ValidationProblem(
                    errors,
                    title: "Uno o más campos son inválidos.",
                    statusCode: StatusCodes.Status400BadRequest,
                    type: "https://tools.ietf.org/html/rfc9110#section-15.5.1",
                    instance: http.Request.Path);
            }

            try
            {
                var command = new UpdateClienteCommand(
                    id,
                    request.Nombre,
                    request.Nit,
                    request.Telefono,
                    request.Ciudad);

                var dto = await handler.HandleAsync(command, ct);

                return Results.Ok(dto);
            }
            catch (ClienteNotFoundException)
            {
                return Results.Problem(
                    title: "Cliente no encontrado",
                    detail: $"No existe ningún cliente con id {id}.",
                    statusCode: StatusCodes.Status404NotFound,
                    type: "https://tools.ietf.org/html/rfc9110#section-15.5.5",
                    instance: http.Request.Path);
            }
            catch (DuplicateNitException)
            {
                return Results.Problem(
                    title: "NIT/RUC duplicado",
                    detail: "Ya existe un cliente con el NIT/RUC indicado.",
                    statusCode: StatusCodes.Status409Conflict,
                    type: "https://tools.ietf.org/html/rfc9110#section-15.5.10",
                    instance: http.Request.Path,
                    extensions: new Dictionary<string, object?> { ["field"] = "nit" });
            }
        })
        .WithName("UpdateCliente");

        return app;
    }
}
