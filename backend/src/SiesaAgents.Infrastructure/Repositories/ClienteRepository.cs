using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.Infrastructure.Repositories;

/// <summary>
/// EF Core-backed implementation of <see cref="IClienteRepository"/>.
/// Story 2.1 is read-only; <c>AsNoTracking</c> avoids the change-tracker
/// overhead. Default ordering matches the "Más reciente" first UX per Story 2.6.
/// </summary>
public class ClienteRepository(AppDbContext dbContext) : IClienteRepository
{
    public async Task<IReadOnlyList<ClienteEntity>> GetAllAsync(
        CancellationToken cancellationToken = default)
    {
        return await dbContext.Clientes
            .AsNoTracking()
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(cancellationToken);
    }
}
