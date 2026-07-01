using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Entities;
using SiesaAgents.Domain.Repositories;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.Infrastructure.Repositories;

public class ContactoRepository(AppDbContext dbContext) : IContactoRepository
{
    public async Task<IReadOnlyList<ContactoEntity>> GetAllAsync(string? searchTerm, CancellationToken ct)
    {
        var query = dbContext.Contactos.AsQueryable();

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(c =>
                EF.Functions.ILike(c.Nombre, $"%{searchTerm}%") ||
                EF.Functions.ILike(c.Email, $"%{searchTerm}%"));
        }

        return await query
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<ContactoEntity?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        return await dbContext.Contactos.FirstOrDefaultAsync(c => c.Id == id, ct);
    }

    public async Task AddAsync(ContactoEntity contacto, CancellationToken ct)
    {
        dbContext.Contactos.Add(contacto);
        await dbContext.SaveChangesAsync(ct);
    }
}
