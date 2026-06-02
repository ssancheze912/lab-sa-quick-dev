using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.API.Endpoints;

/// <summary>
/// Minimal API endpoints for the Clientes module (Epic 2 / Story 2.1).
/// Search is intentionally NOT exposed as a query parameter — it is 100% client-side
/// per architecture line 233 (see Story 2.1 Dev Notes — "Why Search Is Client-Side").
/// </summary>
public static class ClienteEndpoints
{
    public static IEndpointRouteBuilder MapClienteEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/clientes").WithTags("Clientes");

        group.MapGet("/", async (IClienteRepository repo, CancellationToken ct) =>
        {
            var clientes = await repo.GetAllAsync(ct);
            var dto = clientes.Select(c => new ClienteListItemDto(
                c.Id,
                c.Nombre,
                c.Nit,
                c.Telefono,
                c.Ciudad,
                c.CreatedAt,
                c.UpdatedAt));
            return Results.Ok(dto);
        });

        return app;
    }

    public sealed record ClienteListItemDto(
        Guid Id,
        string Nombre,
        string Nit,
        string Telefono,
        string Ciudad,
        DateTimeOffset CreatedAt,
        DateTimeOffset UpdatedAt);
}
