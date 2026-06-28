using Microsoft.EntityFrameworkCore;
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Application.Clientes.Validators;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    public static IEndpointRouteBuilder MapClienteEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/clientes");

        group.MapGet("/", async (GetClientesQueryHandler handler, CancellationToken ct) =>
        {
            var clientes = await handler.HandleAsync(new GetClientesQuery(), ct);
            return Results.Ok(clientes);
        });

        group.MapGet("/{id:guid}", async (Guid id, GetClienteByIdQueryHandler handler, CancellationToken ct) =>
        {
            var dto = await handler.HandleAsync(new GetClienteByIdQuery(id), ct);
            return dto is not null
                ? Results.Ok(dto)
                : Results.Problem(
                    detail: "El cliente solicitado no fue encontrado.",
                    statusCode: 404,
                    title: "Cliente no encontrado");
        });

        group.MapPost("/", async (
            CreateClienteRequest request,
            CreateClienteRequestValidator validator,
            CreateClienteCommandHandler handler,
            CancellationToken ct) =>
        {
            var validation = await validator.ValidateAsync(request, ct);
            if (!validation.IsValid)
                return Results.ValidationProblem(validation.ToDictionary());

            try
            {
                var dto = await handler.Handle(
                    new CreateClienteCommand(request.Nombre, request.Nit, request.Telefono, request.Ciudad), ct);
                return Results.Created($"/api/v1/clientes/{dto.Id}", dto);
            }
            catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
            {
                return Results.Problem(
                    detail: "El NIT/RUC ya está registrado",
                    statusCode: 409,
                    title: "Conflicto de datos");
            }
        });

        group.MapPut("/{id:guid}", async (
            Guid id,
            UpdateClienteRequest request,
            UpdateClienteRequestValidator validator,
            UpdateClienteCommandHandler handler,
            CancellationToken ct) =>
        {
            var validation = await validator.ValidateAsync(request, ct);
            if (!validation.IsValid)
                return Results.ValidationProblem(validation.ToDictionary());

            try
            {
                var dto = await handler.Handle(
                    new UpdateClienteCommand(id, request.Nombre, request.Nit, request.Telefono, request.Ciudad), ct);

                return dto is not null
                    ? Results.Ok(dto)
                    : Results.Problem(
                        detail: "El cliente solicitado no fue encontrado.",
                        statusCode: 404,
                        title: "Cliente no encontrado");
            }
            catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
            {
                return Results.Problem(
                    detail: "El NIT/RUC ya está registrado",
                    statusCode: 409,
                    title: "Conflicto de datos");
            }
        });

        group.MapDelete("/{id:guid}", async (Guid id, IClienteRepository repo, CancellationToken ct) =>
        {
            await repo.DeleteAsync(id, ct);
            await repo.SaveChangesAsync(ct);
            return Results.NoContent();
        });

        return app;
    }

    private static bool IsUniqueConstraintViolation(DbUpdateException ex)
    {
        var inner = ex.InnerException;
        if (inner is null) return false;
        // PostgreSQL unique constraint violation (SQLSTATE 23505)
        var sqlState = inner.GetType().GetProperty("SqlState")?.GetValue(inner) as string;
        return sqlState == "23505";
    }
}
