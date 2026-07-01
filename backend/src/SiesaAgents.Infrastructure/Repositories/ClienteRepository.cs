using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Entities;
using SiesaAgents.Domain.Repositories;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.Infrastructure.Repositories;

public class ClienteRepository(AppDbContext dbContext) : IClienteRepository
{
    public async Task<IReadOnlyList<ClienteEntity>> GetAllAsync(string? searchTerm, CancellationToken ct)
    {
        var query = dbContext.Clientes.AsQueryable();

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(c =>
                EF.Functions.ILike(c.Nombre, $"%{searchTerm}%") ||
                EF.Functions.ILike(c.Nit, $"%{searchTerm}%"));
        }

        return await query
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        return await dbContext.Clientes.FirstOrDefaultAsync(c => c.Id == id, ct);
    }

    public async Task AddAsync(ClienteEntity cliente, CancellationToken ct)
    {
        dbContext.Clientes.Add(cliente);
        await dbContext.SaveChangesAsync(ct);
    }

    public async Task<ClienteEntity?> UpdateAsync(ClienteEntity cliente, CancellationToken ct)
    {
        var tracked = await dbContext.Clientes.FirstOrDefaultAsync(c => c.Id == cliente.Id, ct);
        if (tracked is null)
        {
            return null;
        }

        await dbContext.SaveChangesAsync(ct);
        return tracked;
    }
}
