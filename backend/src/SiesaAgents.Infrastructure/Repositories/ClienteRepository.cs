using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.Infrastructure.Repositories;

public sealed class ClienteRepository(AppDbContext dbContext) : IClienteRepository
{
    public async Task<IEnumerable<ClienteEntity>> GetAllAsync()
    {
        return await dbContext.Clientes
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<ClienteEntity?> GetByIdAsync(Guid id)
    {
        return await dbContext.Clientes.FindAsync(id);
    }

    public async Task<ClienteEntity> CreateAsync(ClienteEntity entity)
    {
        dbContext.Clientes.Add(entity);
        await dbContext.SaveChangesAsync();
        return entity;
    }

    public async Task<ClienteEntity> UpdateAsync(ClienteEntity entity)
    {
        dbContext.Clientes.Update(entity);
        await dbContext.SaveChangesAsync();
        return entity;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var entity = await dbContext.Clientes.FindAsync(id);
        if (entity is null)
            return false;

        dbContext.Clientes.Remove(entity);
        await dbContext.SaveChangesAsync();
        return true;
    }
}
