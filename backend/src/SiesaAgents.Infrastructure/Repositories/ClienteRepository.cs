using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.Infrastructure.Repositories;

public sealed class ClienteRepository(AppDbContext dbContext) : IClienteRepository
{
    public async Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct = default)
    {
        return await dbContext.Clientes
            .AsNoTracking()
            .ToListAsync(ct);
    }

    public async Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await dbContext.Clientes
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id, ct);
    }

    public async Task AddAsync(ClienteEntity cliente, CancellationToken ct = default)
    {
        await dbContext.Clientes.AddAsync(cliente, ct);
    }

    public async Task DeleteAsync(ClienteEntity cliente, CancellationToken ct = default)
    {
        dbContext.Clientes.Remove(cliente);
        await Task.CompletedTask;
    }

    public async Task SaveChangesAsync(CancellationToken ct = default)
    {
        await dbContext.SaveChangesAsync(ct);
    }
}
