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

    public async Task<ContactoEntity> CreateAsync(ContactoEntity entity, CancellationToken ct)
    {
        _context.Contactos.Add(entity);
        await _context.SaveChangesAsync(ct);
        return entity;
    }
}
