using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Contactos.Entities;
using SiesaAgents.Domain.Contactos.Interfaces;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.Infrastructure.Repositories;

public class ContactoRepository : IContactoRepository
{
    private readonly AppDbContext _context;

    public ContactoRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ContactoEntity>> GetAllAsync(CancellationToken ct)
    {
        return await _context.Contactos
            .AsNoTracking()
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<ContactoEntity?> GetByIdAsync(Guid id, CancellationToken ct)
        => await _context.Contactos.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task<IEnumerable<ContactoEntity>> GetByClienteIdAsync(Guid clienteId, CancellationToken ct)
        => await _context.Contactos
            .AsNoTracking()
            .Where(c => c.ClienteId == clienteId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(ct);

    public async Task<IEnumerable<ContactoEntity>> GetOrphanAsync(CancellationToken ct)
        => await _context.Contactos
            .AsNoTracking()
            .Where(c => c.ClienteId == null)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(ct);

    public async Task<ContactoEntity> CreateAsync(ContactoEntity entity, CancellationToken ct)
    {
        _context.Contactos.Add(entity);
        await _context.SaveChangesAsync(ct);
        return entity;
    }

    public async Task<ContactoEntity> UpdateAsync(ContactoEntity entity, CancellationToken ct)
    {
        _context.Entry(entity).State = Microsoft.EntityFrameworkCore.EntityState.Modified;
        await _context.SaveChangesAsync(ct);
        return entity;
    }

    public async Task DeleteAsync(ContactoEntity entity, CancellationToken ct)
    {
        var tracked = await _context.Contactos.FindAsync([entity.Id], ct);
        if (tracked is not null)
        {
            _context.Contactos.Remove(tracked);
            await _context.SaveChangesAsync(ct);
        }
    }
}
