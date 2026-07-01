using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.Infrastructure.Repositories;

/// <summary>
/// EF Core implementation of <see cref="IClienteRepository"/> — Story 2.1 read-side.
///
/// <see cref="GetAllAsync"/> returns the full list sorted by <c>CreatedAt DESC</c> (matching the
/// epic-wide "Más reciente" default sort of Story 2.6). <c>AsNoTracking()</c> is used because the
/// result is projected into a DTO for the API response — no change tracking is needed.
/// </summary>
public class ClienteRepository(AppDbContext db) : IClienteRepository
{
    private readonly AppDbContext _db = db;

    public async Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct = default)
    {
        return await _db.Clientes
            .AsNoTracking()
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(ct);
    }
}
