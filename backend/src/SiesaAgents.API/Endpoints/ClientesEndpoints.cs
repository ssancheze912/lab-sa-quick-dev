using Microsoft.AspNetCore.Mvc;
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Application.Clientes.Validators;

namespace SiesaAgents.API.Endpoints;

public static class ClientesEndpoints
{
    public static IEndpointRouteBuilder MapClientesEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/clientes", async (IGetClientesQueryHandler handler) =>
        {
            var clientes = await handler.HandleAsync(new GetClientesQuery());
            return Results.Ok(clientes);
        })
        .WithName("GetClientes")
        .WithSummary("Get all clients");

        app.MapGet("/api/v1/clientes/{id:guid}", async (Guid id, IGetClienteByIdQueryHandler handler) =>
        {
            var cliente = await handler.HandleAsync(new GetClienteByIdQuery(id));

            if (cliente is null)
            {
                var problem = new ProblemDetails
                {
                    Status = StatusCodes.Status404NotFound,
                    Title = "Not Found",
                    Detail = $"Cliente con ID {id} no encontrado."
                };
                return Results.Json(problem, statusCode: StatusCodes.Status404NotFound, contentType: "application/problem+json");
            }

            return Results.Ok(cliente);
        })
        .WithName("GetClienteById")
        .WithSummary("Get client by ID");

        app.MapPost("/api/v1/clientes", async (CreateClienteCommand command, ICreateClienteCommandHandler handler) =>
        {
            var validator = new CreateClienteRequestValidator();
            var validationResult = await validator.ValidateAsync(command);

            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors
                    .GroupBy(e => e.PropertyName, StringComparer.OrdinalIgnoreCase)
                    .ToDictionary(
                        g => char.ToLowerInvariant(g.Key[0]) + g.Key[1..],
                        g => g.Select(e => e.ErrorMessage).ToArray()
                    );

                var validationProblem = new
                {
                    status = StatusCodes.Status400BadRequest,
                    title = "Validation Error",
                    errors
                };

                return Results.Json(validationProblem, statusCode: StatusCodes.Status400BadRequest, contentType: "application/problem+json");
            }

            var dto = await handler.HandleAsync(command);

            return Results.Created($"/api/v1/clientes/{dto.Id}", dto);
        })
        .WithName("CreateCliente")
        .WithSummary("Create a new client");

        return app;
    }
}
