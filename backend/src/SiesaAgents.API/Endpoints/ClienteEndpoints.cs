using FluentValidation;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Application.Clientes.Validators;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    public static IEndpointRouteBuilder MapClienteEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/clientes");

        // GET /api/v1/clientes — returns all clientes ordered by createdAt descending
        group.MapGet("/", async (IGetClientesQueryHandler handler, CancellationToken ct) =>
        {
            var clientes = await handler.HandleAsync(new GetClientesQuery(), ct);
            return Results.Ok(clientes);
        });

        // POST /api/v1/clientes — create a new cliente (used by Story 2.3; included here for API-2 test)
        group.MapPost("/", async (
            CreateClienteRequest request,
            IValidator<CreateClienteRequest> validator,
            IClienteRepository repo,
            CancellationToken ct) =>
        {
            var validation = await validator.ValidateAsync(request, ct);
            if (!validation.IsValid)
            {
                return Results.ValidationProblem(validation.ToDictionary());
            }

            var cliente = ClienteEntity.Create(request.Nombre, request.Nit, request.Telefono, request.Ciudad);
            await repo.AddAsync(cliente, ct);
            await repo.SaveChangesAsync(ct);
            return Results.Created($"/api/v1/clientes/{cliente.Id}", new
            {
                cliente.Id,
                cliente.Nombre,
                cliente.Nit,
                cliente.Telefono,
                cliente.Ciudad,
                cliente.CreatedAt,
                cliente.UpdatedAt
            });
        });

        // DELETE /api/v1/clientes/{id} — used for cleanup in API-2 test
        group.MapDelete("/{id:guid}", async (Guid id, IClienteRepository repo, CancellationToken ct) =>
        {
            var cliente = await repo.GetByIdAsync(id, ct);
            if (cliente is null) return Results.NotFound();
            await repo.DeleteAsync(cliente, ct);
            await repo.SaveChangesAsync(ct);
            return Results.NoContent();
        });

        return app;
    }
}
