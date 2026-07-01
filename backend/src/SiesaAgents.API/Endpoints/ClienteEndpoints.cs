using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using SiesaAgents.Application.Commands.Clientes;
using SiesaAgents.Application.Queries.Clientes;
using SiesaAgents.Application.Validators;

namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    // Postgres error code for a unique-constraint violation (23505).
    private const string UniqueViolationSqlState = "23505";

    public static IEndpointRouteBuilder MapClienteEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/clientes", async (
                string? q,
                GetClientesQueryHandler handler,
                CancellationToken ct) =>
            {
                var result = await handler.HandleAsync(new GetClientesQuery(q), ct);
                return Results.Ok(result);
            })
            .WithName("GetClientes")
            .WithTags("Clientes");

        app.MapGet("/api/v1/clientes/{id:guid}", async (
                Guid id,
                GetClienteByIdQueryHandler handler,
                CancellationToken ct) =>
            {
                var result = await handler.HandleAsync(new GetClienteByIdQuery(id), ct);
                return result is null ? Results.NotFound() : Results.Ok(result);
            })
            .WithName("GetClienteById")
            .WithTags("Clientes");

        app.MapPost("/api/v1/clientes", async (
                CreateClienteCommand command,
                CreateClienteCommandHandler handler,
                CancellationToken ct) =>
            {
                var validator = new CreateClienteRequestValidator();
                var validationResult = validator.Validate(command);
                if (!validationResult.IsValid)
                {
                    return Results.ValidationProblem(validationResult.ToDictionary());
                }

                try
                {
                    var created = await handler.HandleAsync(command, ct);
                    return Results.Created($"/api/v1/clientes/{created.Id}", created);
                }
                catch (DbUpdateException ex) when (IsUniqueViolation(ex))
                {
                    return Results.Problem(
                        statusCode: StatusCodes.Status409Conflict,
                        title: "Conflict",
                        detail: "El NIT/RUC ya está registrado");
                }
            })
            .WithName("CreateCliente")
            .WithTags("Clientes");

        app.MapPut("/api/v1/clientes/{id:guid}", async (
                Guid id,
                UpdateClienteCommand command,
                UpdateClienteCommandHandler handler,
                CancellationToken ct) =>
            {
                var effectiveCommand = command with { Id = id };

                var validator = new UpdateClienteRequestValidator();
                var validationResult = validator.Validate(effectiveCommand);
                if (!validationResult.IsValid)
                {
                    return Results.ValidationProblem(validationResult.ToDictionary());
                }

                try
                {
                    var updated = await handler.HandleAsync(effectiveCommand, ct);
                    return updated is null ? Results.NotFound() : Results.Ok(updated);
                }
                catch (DbUpdateException ex) when (IsUniqueViolation(ex))
                {
                    return Results.Problem(
                        statusCode: StatusCodes.Status409Conflict,
                        title: "Conflict",
                        detail: "El NIT/RUC ya está registrado");
                }
            })
            .WithName("UpdateCliente")
            .WithTags("Clientes");

        return app;
    }

    private static bool IsUniqueViolation(DbUpdateException ex) =>
        ex.InnerException is PostgresException { SqlState: UniqueViolationSqlState };
}
