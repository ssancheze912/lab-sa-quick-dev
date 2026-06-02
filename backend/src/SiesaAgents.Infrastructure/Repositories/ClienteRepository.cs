using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.Infrastructure.Repositories;

/// <summary>
/// EF Core implementation of <see cref="IClienteRepository"/>.
/// Uses <c>AsNoTracking()</c> because the only consumer (Story 2.1 list endpoint)
/// does not mutate the returned graph.
/// </summary>
public class ClienteRepository : IClienteRepository
{
    private readonly AppDbContext _db;

    public ClienteRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct = default)
    {
        return await _db.Clientes
            .AsNoTracking()
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(ct);
    }
}
