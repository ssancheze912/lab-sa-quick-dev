using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Contactos.Entities;
using SiesaAgents.Domain.Contactos.Interfaces;
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

    public async Task<ContactoEntity?> GetByIdAsync(Guid id)
    {
        return await dbContext.Contactos.FindAsync(id);
    }
}
