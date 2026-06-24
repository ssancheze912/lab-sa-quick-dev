using Microsoft.EntityFrameworkCore;
using SiesaAgents.Application.Clientes.Interfaces;
using SiesaAgents.Domain.Entities;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.Infrastructure.Repositories;

public class ClienteRepository(AppDbContext dbContext) : IClienteRepository
{
    public async Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct = default)
    {
        return await dbContext.Clientes
            .AsNoTracking()
            .ToListAsync(ct);
    }

    public async Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await dbContext.Clientes
            .FirstOrDefaultAsync(c => c.Id == id, ct);
    }

    public async Task AddAsync(ClienteEntity entity, CancellationToken ct = default)
    {
        await dbContext.Clientes.AddAsync(entity, ct);
    }

    public Task DeleteAsync(ClienteEntity entity, CancellationToken ct = default)
    {
        dbContext.Clientes.Remove(entity);
        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync(CancellationToken ct = default)
    {
        await dbContext.SaveChangesAsync(ct);
    }
}
