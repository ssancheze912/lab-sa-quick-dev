using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.Infrastructure.Repositories;

public class ClienteRepository(AppDbContext context) : IClienteRepository
{
    public async Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)
    {
        return await context.Clientes.OrderByDescending(c => c.CreatedAt).ToListAsync(ct);
    }

    public async Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        return await context.Clientes.FindAsync([id], ct);
    }

    public async Task AddAsync(ClienteEntity entity, CancellationToken ct)
    {
        await context.Clientes.AddAsync(entity, ct);
        await context.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(ClienteEntity entity, CancellationToken ct)
    {
        context.Clientes.Update(entity);
        await context.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct)
    {
        var entity = await context.Clientes.FindAsync([id], ct);
        if (entity is not null)
        {
            context.Clientes.Remove(entity);
            await context.SaveChangesAsync(ct);
        }
    }

    public async Task<bool> NitExistsAsync(string nit, CancellationToken ct)
    {
        return await context.Clientes.AnyAsync(c => c.Nit == nit, ct);
    }
}
