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

    public async Task AddAsync(ClienteEntity cliente, CancellationToken cancellationToken = default)
    {
        // The repo is intentionally naive: it delegates to EF Core and lets
        // DbUpdateException bubble up. Mapping (23505 -> DuplicateNitException) is
        // an application-layer decision made by the handler.
        _db.Clientes.Add(cliente);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(ClienteEntity cliente, CancellationToken cancellationToken = default)
    {
        // GetByIdAsync uses AsNoTracking (Story 2.2), so the entity returned to
        // the handler is detached. We reattach it as Modified so EF Core writes
        // the mutated columns. `.Update(entity)` marks ALL properties dirty; that
        // is intentional — the DTO always ships the four mutable fields and the
        // domain method refreshes UpdatedAt, so the diff is deterministic. It
        // also lets DbUpdateException bubble up (23505 mapping happens in the
        // application handler — Clean Architecture: infra reports, application
        // decides).
        _db.Clientes.Update(cliente);
        await _db.SaveChangesAsync(cancellationToken);
    }
}
