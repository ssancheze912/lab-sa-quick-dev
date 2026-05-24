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

    public async Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => await context.Clientes
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

    public async Task AddAsync(ClienteEntity cliente, CancellationToken cancellationToken = default)
    {
        await context.Clientes.AddAsync(cliente, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }
}
