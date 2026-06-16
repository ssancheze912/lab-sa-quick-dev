using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    public static void MapClienteEndpoints(this WebApplication app)
    {
        app.MapGet("/api/v1/clientes", async (
            GetClientesQueryHandler handler,
            CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(new GetClientesQuery(), ct);
            return Results.Ok(result);
        })
        .WithName("GetClientes")
        .Produces<IReadOnlyList<ClienteDto>>(200);

        app.MapGet("/api/v1/clientes/{id:guid}", async (
            Guid id,
            IClienteRepository repo,
            CancellationToken ct) =>
        {
            var cliente = await repo.GetByIdAsync(id, ct);
            if (cliente is null)
                return Results.Problem(
                    title: "Cliente no encontrado",
                    statusCode: 404,
                    detail: $"No existe un cliente con id '{id}'.");

            return Results.Ok(new ClienteDto(
                cliente.Id,
                cliente.Nombre,
                cliente.NIT,
                cliente.Telefono,
                cliente.Ciudad,
                cliente.CreatedAt,
                cliente.UpdatedAt));
        })
        .WithName("GetClienteById")
        .Produces<ClienteDto>(200)
        .ProducesProblem(404);

        app.MapPost("/api/v1/clientes", async (
            CreateClienteRequest request,
            IClienteRepository repo,
            CancellationToken ct) =>
        {
            var cliente = SiesaAgents.Domain.Clientes.Entities.ClienteEntity.Create(
                request.Nombre, request.NIT, request.Telefono, request.Ciudad);
            await repo.AddAsync(cliente, ct);
            await repo.SaveChangesAsync(ct);

            var dto = new ClienteDto(
                cliente.Id, cliente.Nombre, cliente.NIT,
                cliente.Telefono, cliente.Ciudad, cliente.CreatedAt, cliente.UpdatedAt);
            return Results.Created($"/api/v1/clientes/{cliente.Id}", dto);
        })
        .WithName("CreateCliente")
        .Produces<ClienteDto>(201)
        .ProducesProblem(409);

        app.MapDelete("/api/v1/clientes/{id:guid}", async (
            Guid id,
            IClienteRepository repo,
            CancellationToken ct) =>
        {
            var cliente = await repo.GetByIdAsync(id, ct);
            if (cliente is null)
                return Results.Problem(
                    title: "Cliente no encontrado",
                    statusCode: 404,
                    detail: $"No existe un cliente con id '{id}'.");

            await repo.DeleteAsync(cliente, ct);
            await repo.SaveChangesAsync(ct);
            return Results.NoContent();
        })
        .WithName("DeleteCliente")
        .Produces(204)
        .ProducesProblem(404);
    }
}

public record CreateClienteRequest(string Nombre, string NIT, string Telefono, string Ciudad);
