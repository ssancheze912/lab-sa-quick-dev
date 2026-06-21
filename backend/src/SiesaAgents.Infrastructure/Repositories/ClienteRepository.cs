using Microsoft.EntityFrameworkCore;
using SiesaAgents.Application.Clientes.Interfaces;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.Infrastructure.Repositories;

public class ClienteRepository(AppDbContext dbContext) : IClienteRepository
{
    public async Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken = default)
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

    public async Task<ClienteEntity> AddAsync(ClienteEntity entity, CancellationToken cancellationToken = default)
    {
        dbContext.Clientes.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return entity;
    }
}
