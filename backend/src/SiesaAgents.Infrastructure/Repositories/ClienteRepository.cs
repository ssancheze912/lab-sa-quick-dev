using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.Infrastructure.Repositories;

public class ClienteRepository(AppDbContext context) : IClienteRepository
{
    public async Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken = default)
        => await context.Clientes.AsNoTracking().ToListAsync(cancellationToken);

    public async Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => await context.Clientes.FindAsync([id], cancellationToken);

    public async Task<ClienteEntity?> GetByNitAsync(string nit, CancellationToken cancellationToken = default)
        => await context.Clientes.AsNoTracking().FirstOrDefaultAsync(c => c.Nit == nit, cancellationToken);

    public async Task AddAsync(ClienteEntity cliente, CancellationToken cancellationToken = default)
        => await context.Clientes.AddAsync(cliente, cancellationToken);

    public void Update(ClienteEntity cliente)
        => context.Clientes.Update(cliente);

    public void Remove(ClienteEntity cliente)
        => context.Clientes.Remove(cliente);

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
        => await context.SaveChangesAsync(cancellationToken);
}
