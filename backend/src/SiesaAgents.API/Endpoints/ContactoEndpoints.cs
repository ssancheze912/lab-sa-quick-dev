using Microsoft.EntityFrameworkCore;
using SiesaAgents.Application.Contactos.DTOs;
using SiesaAgents.Application.Contactos.Queries;
using SiesaAgents.Application.Contactos.Validators;
using SiesaAgents.Domain.Contactos.Entities;
using SiesaAgents.Domain.Contactos.Interfaces;

namespace SiesaAgents.API.Endpoints;

public static class ContactoEndpoints
{
    public static IEndpointRouteBuilder MapContactoEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/contactos");

        group.MapGet("/", async (GetContactosQueryHandler handler, CancellationToken ct) =>
        {
            var contactos = await handler.HandleAsync(new GetContactosQuery(), ct);
            return Results.Ok(contactos);
        });

        group.MapGet("/{id:guid}", async (Guid id, IContactoRepository repo, CancellationToken ct) =>
        {
            var contacto = await repo.GetByIdAsync(id, ct);
            if (contacto is null)
                return Results.Problem(
                    detail: "El contacto solicitado no fue encontrado.",
                    statusCode: 404,
                    title: "Contacto no encontrado");
            return Results.Ok(new ContactoDto(
                contacto.Id, contacto.Nombre, contacto.Cargo, contacto.Telefono,
                contacto.Email, contacto.ClienteId, contacto.CreatedAt, contacto.UpdatedAt));
        });

        group.MapPost("/", async (
            CreateContactoRequest request,
            CreateContactoRequestValidator validator,
            IContactoRepository repo,
            CancellationToken ct) =>
        {
            var validation = await validator.ValidateAsync(request, ct);
            if (!validation.IsValid)
                return Results.ValidationProblem(validation.ToDictionary());

            try
            {
                var contacto = ContactoEntity.Create(request.Nombre, request.Cargo, request.Telefono, request.Email);
                await repo.AddAsync(contacto, ct);
                await repo.SaveChangesAsync(ct);
                var dto = new ContactoDto(
                    contacto.Id, contacto.Nombre, contacto.Cargo, contacto.Telefono,
                    contacto.Email, contacto.ClienteId, contacto.CreatedAt, contacto.UpdatedAt);
                return Results.Created($"/api/v1/contactos/{contacto.Id}", dto);
            }
            catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
            {
                return Results.Problem(
                    detail: "El email ya está registrado",
                    statusCode: 409,
                    title: "Conflicto de datos");
            }
        });

        group.MapDelete("/{id:guid}", async (Guid id, IContactoRepository repo, CancellationToken ct) =>
        {
            var contacto = await repo.GetByIdAsync(id, ct);
            if (contacto is null)
                return Results.Problem(
                    detail: "El contacto solicitado no fue encontrado.",
                    statusCode: 404,
                    title: "Contacto no encontrado");
            await repo.DeleteAsync(contacto, ct);
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
