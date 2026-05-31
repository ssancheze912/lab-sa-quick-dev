using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.Infrastructure.Repositories;

public class ClienteRepository(AppDbContext dbContext) : IClienteRepository
{
    public async Task<IEnumerable<ClienteEntity>> GetAllAsync()
    {
        return await dbContext.Clientes
            .AsNoTracking()
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<ClienteEntity?> GetByIdAsync(Guid id)
    {
        return await dbContext.Clientes.FindAsync(id);
    }
}
