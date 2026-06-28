using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.Infrastructure.Repositories;

public sealed class ClienteRepository(AppDbContext dbContext) : IClienteRepository
{
    public async Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await dbContext.Clientes
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await dbContext.Clientes
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task AddAsync(ClienteEntity cliente, CancellationToken cancellationToken = default)
    {
        await dbContext.Clientes.AddAsync(cliente, cancellationToken);
    }

    public async Task DeleteAsync(ClienteEntity cliente, CancellationToken cancellationToken = default)
    {
        dbContext.Clientes.Remove(cliente);
        await Task.CompletedTask;
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
