using Microsoft.EntityFrameworkCore;
using SiesaAgents.Application.Contactos.Interfaces;
using SiesaAgents.Domain.Entities;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.Infrastructure.Repositories;

public sealed class ContactoRepository(AppDbContext dbContext) : IContactoRepository
{
    public async Task<IEnumerable<ContactoEntity>> GetAllAsync()
    {
        return await dbContext.Contactos
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<ContactoEntity?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await dbContext.Contactos
            .FirstOrDefaultAsync(c => c.Id == id, ct);
    }

    public async Task AddAsync(ContactoEntity entity, CancellationToken ct = default)
    {
        await dbContext.Contactos.AddAsync(entity, ct);
    }

    public Task UpdateAsync(ContactoEntity entity, CancellationToken ct = default)
    {
        dbContext.Contactos.Update(entity);
        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync(CancellationToken ct = default)
    {
        await dbContext.SaveChangesAsync(ct);
    }
}
