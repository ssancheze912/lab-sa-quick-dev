using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.Infrastructure.Repositories;

public class ClienteRepository(AppDbContext dbContext) : IClienteRepository
{
    public async Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await dbContext.Clientes
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await dbContext.Clientes
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task AddAsync(ClienteEntity cliente, CancellationToken cancellationToken = default)
    {
        await dbContext.Clientes.AddAsync(cliente, cancellationToken);
    }

    public async Task UpdateAsync(ClienteEntity entity, CancellationToken cancellationToken = default)
    {
        dbContext.Clientes.Update(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var cliente = await dbContext.Clientes.FindAsync([id], cancellationToken);
        if (cliente is not null)
            dbContext.Clientes.Remove(cliente);
    }

    public Task DeleteAsync(ClienteEntity entity, CancellationToken cancellationToken = default)
    {
        dbContext.Clientes.Remove(entity);
        return dbContext.SaveChangesAsync(cancellationToken);
    }

    public Task<int> CountContactosByClienteIdAsync(Guid clienteId, CancellationToken cancellationToken = default)
    {
        // Epic 3 dependency: Contactos table does not yet exist.
        // Returns 0 always until Epic 3 is implemented.
        return Task.FromResult(0);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
