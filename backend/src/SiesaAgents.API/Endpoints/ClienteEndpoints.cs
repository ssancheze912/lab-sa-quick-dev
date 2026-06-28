using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
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

        group.MapPost("/", async (CreateClienteRequest request, IClienteRepository repo, CancellationToken ct) =>
        {
            var cliente = ClienteEntity.Create(request.Nombre, request.Nit, request.Telefono, request.Ciudad);
            await repo.AddAsync(cliente, ct);
            await repo.SaveChangesAsync(ct);
            return Results.Created(
                $"/api/v1/clientes/{cliente.Id}",
                new ClienteDto(cliente.Id, cliente.Nombre, cliente.Nit, cliente.Telefono, cliente.Ciudad, cliente.CreatedAt, cliente.UpdatedAt));
        });

        group.MapDelete("/{id:guid}", async (Guid id, IClienteRepository repo, CancellationToken ct) =>
        {
            await repo.DeleteAsync(id, ct);
            await repo.SaveChangesAsync(ct);
            return Results.NoContent();
        });

        return app;
    }

    private sealed record CreateClienteRequest(string Nombre, string Nit, string Telefono, string Ciudad);
}
