using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.Infrastructure.Repositories;

/// <summary>
/// EF Core-backed persistence for the Cliente aggregate.
/// </summary>
public class ClienteRepository : IClienteRepository
{
    private readonly AppDbContext _db;

    public ClienteRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        // AsNoTracking: this is a read-only projection; skip change tracker allocation.
        // Default sort "Más reciente" (per Story 2.6) is applied server-side; the
        // frontend re-orders client-side once the user picks a different sort.
        return await _db.Clientes
            .AsNoTracking()
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        // AsNoTracking: detail read is idempotent — no change tracker allocation
        // is required. Returns null when the id does not match (mapped to 404
        // upstream by the handler / endpoint).
        return await _db.Clientes
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }
}
