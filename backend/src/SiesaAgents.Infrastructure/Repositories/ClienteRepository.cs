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

    public async Task<ClienteEntity> CreateAsync(ClienteEntity cliente, CancellationToken ct)
    {
        _context.Clientes.Add(cliente);
        await _context.SaveChangesAsync(ct);
        return cliente;
    }

    public async Task UpdateAsync(ClienteEntity entity, CancellationToken ct)
    {
        _context.Clientes.Update(entity);
        await _context.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct)
    {
        var cliente = await _context.Clientes.FindAsync([id], ct);
        if (cliente is null) return false;
        _context.Clientes.Remove(cliente);
        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> ExistsByNitAsync(string nit, CancellationToken ct)
        => await _context.Clientes.AnyAsync(c => c.Nit == nit, ct);
}
