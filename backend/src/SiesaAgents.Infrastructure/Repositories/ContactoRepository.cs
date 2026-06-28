using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Contactos.Entities;
using SiesaAgents.Domain.Contactos.Interfaces;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.Infrastructure.Repositories;

public class ContactoRepository(AppDbContext dbContext) : IContactoRepository
{
    public async Task<IReadOnlyList<ContactoEntity>> GetAllAsync(CancellationToken ct = default)
    {
        return await dbContext.Contactos
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<ContactoEntity?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await dbContext.Contactos
            .FirstOrDefaultAsync(c => c.Id == id, ct);
    }

    public async Task AddAsync(ContactoEntity contacto, CancellationToken ct = default)
    {
        await dbContext.Contactos.AddAsync(contacto, ct);
    }

    public async Task SaveChangesAsync(CancellationToken ct = default)
    {
        await dbContext.SaveChangesAsync(ct);
    }

    public Task DeleteAsync(ContactoEntity contacto, CancellationToken ct = default)
    {
        dbContext.Contactos.Remove(contacto);
        return Task.CompletedTask;
    }

    public async Task UpdateAsync(ContactoEntity contacto, CancellationToken ct = default)
    {
        dbContext.Contactos.Update(contacto);
        await dbContext.SaveChangesAsync(ct);
    }
}
