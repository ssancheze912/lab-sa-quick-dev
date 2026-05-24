using MediatR;
using Microsoft.AspNetCore.Mvc;
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.Queries;

namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    public static IEndpointRouteBuilder MapClienteEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/clientes", async (IMediator mediator, CancellationToken ct) =>
        {
            var result = await mediator.Send(new GetClientesQuery(), ct);
            return Results.Ok(result);
        })
        .WithName("GetClientes")
        .WithTags("Clientes");

        app.MapGet("/api/v1/clientes/{id:guid}", async (Guid id, IMediator mediator, CancellationToken ct) =>
        {
            var result = await mediator.Send(new GetClienteByIdQuery(id), ct);
            if (result is null)
            {
                return TypedResults.Problem(
                    detail: $"Cliente con id '{id}' no encontrado.",
                    statusCode: 404,
                    title: "Not Found",
                    type: "https://tools.ietf.org/html/rfc7807");
            }
            return Results.Ok(result);
        })
        .WithName("GetClienteById")
        .WithTags("Clientes");

        app.MapPost("/api/v1/clientes", async (CreateClienteRequest request, IMediator mediator, CancellationToken ct) =>
        {
            var command = new CreateClienteCommand(request.Nombre, request.Nit, request.Telefono, request.Ciudad);
            var result = await mediator.Send(command, ct);
            return Results.Created($"/api/v1/clientes/{result.Id}", result);
        })
        .WithName("CreateCliente")
        .WithTags("Clientes");

        app.MapDelete("/api/v1/clientes/{id:guid}", async (Guid id, IMediator mediator, CancellationToken ct) =>
        {
            await mediator.Send(new DeleteClienteCommand(id), ct);
            return Results.NoContent();
        })
        .WithName("DeleteCliente")
        .WithTags("Clientes");

        return app;
    }
}

public record CreateClienteRequest(string Nombre, string Nit, string Telefono, string Ciudad);
