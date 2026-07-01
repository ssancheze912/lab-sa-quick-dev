using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Entities;
using SiesaAgents.Domain.Repositories;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.Infrastructure.Repositories;

public class ClienteRepository(AppDbContext dbContext) : IClienteRepository
{
    public async Task<IReadOnlyList<ClienteEntity>> GetAllAsync(string? searchTerm, CancellationToken ct)
    {
        var query = dbContext.Clientes.AsQueryable();

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(c =>
                EF.Functions.ILike(c.Nombre, $"%{searchTerm}%") ||
                EF.Functions.ILike(c.Nit, $"%{searchTerm}%"));
        }

        return await query
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        return await dbContext.Clientes.FirstOrDefaultAsync(c => c.Id == id, ct);
    }

    public async Task AddAsync(ClienteEntity cliente, CancellationToken ct)
    {
        dbContext.Clientes.Add(cliente);
        await dbContext.SaveChangesAsync(ct);
    }

    public async Task<ClienteEntity?> UpdateAsync(ClienteEntity cliente, CancellationToken ct)
    {
        var exists = await dbContext.Clientes.AnyAsync(c => c.Id == cliente.Id, ct);
        if (!exists)
        {
            return null;
        }

        // `cliente` arrives already mutated (via ClienteEntity.Update) and, in
        // the current call path, already tracked by this same scoped
        // DbContext (loaded upstream via GetByIdAsync) — EF Core's identity
        // map means SaveChangesAsync persists its pending changes directly.
        // Marking it explicitly as Modified makes that dependency explicit
        // instead of relying on a second identity-map lookup, so this method
        // also behaves correctly if ever called with a `cliente` that is not
        // already tracked (e.g. reconstructed from a DTO in a future caller).
        dbContext.Entry(cliente).State = dbContext.Entry(cliente).State == EntityState.Detached
            ? EntityState.Modified
            : dbContext.Entry(cliente).State;

        await dbContext.SaveChangesAsync(ct);
        return cliente;
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct)
    {
        // ExecuteDeleteAsync issues a direct SQL DELETE without loading the
        // entity into the change tracker — deliberately avoiding
        // Remove()+SaveChangesAsync(), which would otherwise trigger EF
        // Core's automatic relationship "fixup" for any ContactoEntity
        // already tracked by this same DbContext instance (e.g. seeded
        // earlier in the same unit of work), generating a spurious `UPDATE
        // contactos SET cliente_id = NULL` in application code. That
        // orphaning must happen exactly once, at the database level, via the
        // `ON DELETE SET NULL` FK (ContactoConfiguration) — never via
        // application-tracked state (Story 2.5, R2).
        var affected = await dbContext.Clientes
            .Where(c => c.Id == id)
            .ExecuteDeleteAsync(ct);
        return affected > 0;
    }

    public async Task<int> CountContactosByClienteIdAsync(Guid clienteId, CancellationToken ct)
    {
        return await dbContext.Set<ContactoEntity>().CountAsync(c => c.ClienteId == clienteId, ct);
    }
}
