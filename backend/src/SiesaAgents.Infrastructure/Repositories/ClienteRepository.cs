using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.Infrastructure.Repositories;

public class ClienteRepository(AppDbContext context) : IClienteRepository
{
    public async Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)
        => await context.Clientes.AsNoTracking().ToListAsync(ct);

    public async Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
        => await context.Clientes.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task AddAsync(ClienteEntity cliente, CancellationToken ct)
    {
        await context.Clientes.AddAsync(cliente, ct);
        await context.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(ClienteEntity cliente, CancellationToken ct)
    {
        context.Clientes.Update(cliente);
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
}
