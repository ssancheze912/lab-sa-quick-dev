using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.Infrastructure.Repositories;

/// <summary>
/// EF Core implementation of <see cref="IClienteRepository"/>.
/// Reads use <c>AsNoTracking</c>; the optional search fragment matches both
/// <c>nombre</c> and <c>nit</c> case-insensitively via PostgreSQL <c>ILIKE</c>.
/// </summary>
public sealed class ClienteRepository : IClienteRepository
{
    private readonly AppDbContext _db;

    public ClienteRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<ClienteEntity>> GetAllAsync(string? search, CancellationToken ct)
    {
        var query = _db.Clientes.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            // Escape LIKE metacharacters so a fragment like "100%" or "ABC_1"
            // is treated as a literal substring instead of a wildcard match.
            // EF.Functions.ILike already parameterizes the value (no SQL
            // injection), but the wildcards still apply at the SQL layer.
            var escaped = search
                .Replace("\\", "\\\\")
                .Replace("%", "\\%")
                .Replace("_", "\\_");
            var pattern = $"%{escaped}%";
            query = query.Where(c =>
                EF.Functions.ILike(c.Nombre, pattern, "\\") ||
                EF.Functions.ILike(c.Nit, pattern, "\\"));
        }

        return await query
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(ct);
    }

    public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        return _db.Clientes
            .AsNoTracking()
            .SingleOrDefaultAsync(c => c.Id == id, ct);
    }

    public Task<bool> ExistsByNitAsync(string nit, CancellationToken ct)
    {
        return _db.Clientes
            .AsNoTracking()
            .AnyAsync(c => c.Nit == nit, ct);
    }

    public async Task AddAsync(ClienteEntity entity, CancellationToken ct)
    {
        _db.Clientes.Add(entity);
        await _db.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(ClienteEntity entity, CancellationToken ct)
    {
        _db.Clientes.Update(entity);
        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(ClienteEntity entity, CancellationToken ct)
    {
        _db.Clientes.Remove(entity);
        await _db.SaveChangesAsync(ct);
    }
}
