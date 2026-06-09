using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.Infrastructure.Repositories;

public class ClienteRepository(AppDbContext context) : IClienteRepository
{
    public async Task<List<ClienteEntity>> GetAllAsync()
    {
        return await context.Clientes
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<ClienteEntity?> GetByIdAsync(Guid id)
    {
        return await context.Clientes.FindAsync(id);
    }

    public async Task AddAsync(ClienteEntity cliente)
    {
        await context.Clientes.AddAsync(cliente);
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

    public async Task<bool> ExistsByNitAsync(string nit)
    {
        return await context.Clientes.AnyAsync(c => c.Nit == nit);
    }
}
