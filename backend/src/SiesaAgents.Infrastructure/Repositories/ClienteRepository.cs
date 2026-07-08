using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.Infrastructure.Repositories;

/// <summary>
/// EF Core implementation of <see cref="IClienteRepository"/> (Story 2.1).
/// Reads use <c>AsNoTracking()</c>; writes go through the DbContext's change
/// tracker to enable relational integrity + audit hooks (Story 2.3).
/// </summary>
public sealed class ClienteRepository : IClienteRepository
{
    private readonly AppDbContext _db;

    public ClienteRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct)
    {
        var items = await _db.Clientes
            .AsNoTracking()
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(ct);
        return items;
    }

    public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        return _db.Clientes
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id, ct);
    }

    public async Task AddAsync(ClienteEntity cliente, CancellationToken ct)
    {
        _db.Clientes.Add(cliente);
        await _db.SaveChangesAsync(ct);
    }

    public Task<bool> NitExistsAsync(string nit, CancellationToken ct)
    {
        return _db.Clientes
            .AsNoTracking()
            .AnyAsync(c => c.Nit == nit, ct);
    }

    public async Task UpdateAsync(ClienteEntity cliente, CancellationToken ct)
    {
        // The entity was loaded through GetByIdAsync (AsNoTracking) so we
        // must re-attach as Modified. `Update` on the DbSet flags every
        // scalar property for a full column update — desired behaviour here
        // (Story 2.4).
        _db.Clientes.Update(cliente);
        await _db.SaveChangesAsync(ct);
    }

    public Task<bool> NitExistsForAnotherAsync(Guid id, string nit, CancellationToken ct)
    {
        // Exclude-self semantic guards against the "unchanged NIT = false
        // conflict" bug on every PUT (AC #6). Translates to
        // EXISTS (SELECT 1 FROM clientes WHERE nit = @nit AND id <> @id).
        return _db.Clientes
            .AsNoTracking()
            .AnyAsync(c => c.Nit == nit && c.Id != id, ct);
    }
}
