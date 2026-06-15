using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.Infrastructure.Repositories;

/// <summary>
/// EF Core implementation of <see cref="IClienteRepository"/>. The default
/// sort in <see cref="GetAllAsync"/> is "Más reciente" (newest first) per
/// Story 2.6 default — locking the order here means the frontend doesn't need
/// to sort on initial load.
/// </summary>
public class ClienteRepository : IClienteRepository
{
    private readonly AppDbContext _db;

    public ClienteRepository(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct)
        => await _db.Clientes
            .AsNoTracking()
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(ct);

    public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
        => _db.Clientes.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct);

    public Task<ClienteEntity?> GetByIdForUpdateAsync(Guid id, CancellationToken ct)
        => _db.Clientes.FirstOrDefaultAsync(c => c.Id == id, ct);

    public Task<bool> ExistsByNitAsync(string nit, CancellationToken ct)
        => _db.Clientes.AsNoTracking().AnyAsync(c => c.Nit == nit, ct);

    public Task<bool> ExistsByNitExceptIdAsync(string nit, Guid exceptId, CancellationToken ct)
        => _db.Clientes.AsNoTracking()
            .AnyAsync(c => c.Nit == nit && c.Id != exceptId, ct);

    public async Task AddAsync(ClienteEntity entity, CancellationToken ct)
        => await _db.Clientes.AddAsync(entity, ct);

    public Task RemoveAsync(ClienteEntity entity, CancellationToken ct)
    {
        // `_db.Clientes.Remove(entity)` is synchronous; wrapping in
        // `Task.CompletedTask` keeps the interface async-shaped without forcing
        // a needless `Task.Run`. The actual DB round-trip happens in
        // SaveChangesAsync(ct). Story 2.5.
        _db.Clientes.Remove(entity);
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync(CancellationToken ct)
        => _db.SaveChangesAsync(ct);
}
