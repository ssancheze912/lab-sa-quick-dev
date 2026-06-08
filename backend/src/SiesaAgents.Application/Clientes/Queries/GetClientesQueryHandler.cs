using Microsoft.EntityFrameworkCore;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.Application.Clientes.Queries;

/// <summary>
/// CQRS-lite read handler. Reads <c>AppDbContext.Clientes</c> directly,
/// projects to <see cref="ClienteDto"/>, and orders by <c>CreatedAt</c> DESC
/// (matches Story 2.6's default sort "Más reciente" — no extra backend work
/// required when that story ships).
/// </summary>
public sealed class GetClientesQueryHandler
{
    private readonly AppDbContext _dbContext;

    public GetClientesQueryHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<ClienteDto>> HandleAsync(
        GetClientesQuery query,
        CancellationToken ct)
    {
        return await _dbContext.Clientes
            .AsNoTracking()
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new ClienteDto(
                c.Id,
                c.Nombre,
                c.Nit,
                c.Telefono,
                c.Ciudad,
                c.CreatedAt,
                c.UpdatedAt))
            .ToListAsync(ct);
    }
}
