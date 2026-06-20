using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.Infrastructure.Repositories;

public class ClienteRepository(AppDbContext dbContext) : IClienteRepository
{
    public async Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct = default)
        => await dbContext.Clientes.AsNoTracking().ToListAsync(ct);

    public async Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await dbContext.Clientes.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task AddAsync(ClienteEntity entity, CancellationToken ct = default)
    {
        await dbContext.Clientes.AddAsync(entity, ct);
        await dbContext.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(ClienteEntity entity, CancellationToken ct = default)
    {
        dbContext.Clientes.Update(entity);
        await dbContext.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(ClienteEntity entity, CancellationToken ct = default)
    {
        dbContext.Clientes.Remove(entity);
        await dbContext.SaveChangesAsync(ct);
    }
}
