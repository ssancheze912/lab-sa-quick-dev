using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.Infrastructure.Repositories;

public class ClienteRepository(AppDbContext context) : IClienteRepository
{
    public async Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct = default)
        => await context.Clientes.AsNoTracking().ToListAsync(ct);

    public async Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await context.Clientes.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct);
}
