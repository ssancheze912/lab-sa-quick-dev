using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Application.Interfaces;

public interface IClientesDbContext
{
    DbSet<ClienteEntity> Clientes { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
