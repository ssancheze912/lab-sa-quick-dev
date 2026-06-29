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
}
