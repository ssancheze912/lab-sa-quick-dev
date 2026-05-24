using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.Infrastructure.Repositories;

public class ClienteRepository(SiesaAgentsDbContext context) : IClienteRepository
{
    public async Task<IEnumerable<ClienteEntity>> GetAllAsync()
    {
        return await context.Clientes
            .AsNoTracking()
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<ClienteEntity?> GetByIdAsync(Guid id)
    {
        return await context.Clientes
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task CreateAsync(ClienteEntity cliente)
    {
        context.Clientes.Add(cliente);
        await context.SaveChangesAsync();
    }

    public async Task UpdateAsync(ClienteEntity cliente)
    {
        context.Clientes.Update(cliente);
        await context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid id)
    {
        var cliente = await context.Clientes.FindAsync(id);
        if (cliente is not null)
        {
            context.Clientes.Remove(cliente);
            await context.SaveChangesAsync();
        }
    }
}
