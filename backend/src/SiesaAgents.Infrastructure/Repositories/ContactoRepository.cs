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
}
