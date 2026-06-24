using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Contactos.Interfaces;
using SiesaAgents.Domain.Entities;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.Infrastructure.Repositories;

public class ContactoRepository(AppDbContext dbContext) : IContactoRepository
{
    public async Task<IEnumerable<ContactoEntity>> GetAllAsync(CancellationToken ct = default)
    {
        return await dbContext.Contactos
            .AsNoTracking()
            .ToListAsync(ct);
    }
}
