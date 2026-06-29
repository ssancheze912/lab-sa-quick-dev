using Microsoft.EntityFrameworkCore;
using SiesaAgents.Application.Clientes.Interfaces;
using SiesaAgents.Domain.Entities;
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
        return await dbContext.Clientes
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task AddAsync(ClienteEntity entity)
    {
        await dbContext.Clientes.AddAsync(entity);
    }

    public Task UpdateAsync(ClienteEntity entity)
    {
        dbContext.Clientes.Update(entity);
        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync()
    {
        await dbContext.SaveChangesAsync();
    }

    public async Task<ClienteEntity?> GetByNitAsync(string nit)
    {
        return await dbContext.Clientes
            .FirstOrDefaultAsync(c => c.Nit == nit);
    }
}
