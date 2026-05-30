using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.Infrastructure.Repositories;

public class ClienteRepository : IClienteRepository
{
    private readonly AppDbContext _context;

    public ClienteRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct)
    {
        return await _context.Clientes.AsNoTracking().ToListAsync(ct);
    }

    public async Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        return await _context.Clientes.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
    }
}
