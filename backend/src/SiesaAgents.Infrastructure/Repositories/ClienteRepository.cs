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

    public async Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)
        => await _context.Clientes.OrderBy(c => c.Nombre).ToListAsync(ct);

    public async Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
        => await _context.Clientes.FirstOrDefaultAsync(c => c.Id == id, ct);
}
