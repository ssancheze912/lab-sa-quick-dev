using Microsoft.EntityFrameworkCore;
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Application.Clientes.Validators;

namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    public static void MapClienteEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/v1/clientes");
        group.MapGet("/", GetAllClientes);
        group.MapGet("/{id:guid}", GetClienteById);
        group.MapPost("/", CreateCliente);
    }

    private static async Task<IResult> GetAllClientes(
        GetClientesQueryHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new GetClientesQuery(), cancellationToken);
        return Results.Ok(result);
    }

    private static async Task<IResult> GetClienteById(
        Guid id,
        GetClienteByIdQueryHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.Handle(new GetClienteByIdQuery(id), cancellationToken);
        return result is null
            ? Results.Problem(title: "Cliente no encontrado.", statusCode: StatusCodes.Status404NotFound)
            : Results.Ok(result);
    }

    private static async Task<IResult> CreateCliente(
        CreateClienteRequest request,
        CreateClienteRequestValidator validator,
        CreateClienteCommandHandler handler,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        try
        {
            var result = await handler.Handle(new CreateClienteCommand(request), cancellationToken);
            return Results.Created($"/api/v1/clientes/{result.Id}", result);
        }
        catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("uk_clientes_nit") == true)
        {
            return Results.Conflict(new { title = "El NIT/RUC ya está registrado.", status = 409 });
        }
    }
}
