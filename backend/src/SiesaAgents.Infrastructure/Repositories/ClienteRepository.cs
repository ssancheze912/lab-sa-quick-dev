using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.Infrastructure.Repositories;

public sealed class ClienteRepository(AppDbContext context) : IClienteRepository
{
    public async Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct = default)
    {
        return await context.Clientes
            .AsNoTracking()
            .ToListAsync(ct);
    }
}
