using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.Infrastructure.Repositories;

public sealed class ClienteRepository(SiesaAgentsDbContext context) : IClienteRepository
{
    public async Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await context.Clientes
            .AsNoTracking()
            .OrderBy(c => c.Nombre)
            .ToListAsync(cancellationToken);
    }
}
