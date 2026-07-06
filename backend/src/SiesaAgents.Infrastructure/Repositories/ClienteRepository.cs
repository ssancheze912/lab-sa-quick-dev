using Microsoft.EntityFrameworkCore;
using Npgsql;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.Infrastructure.Repositories;

public class ClienteRepository(AppDbContext dbContext) : IClienteRepository
{
    public async Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await dbContext.Clientes
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.Clientes
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<bool> AddAsync(ClienteEntity cliente, CancellationToken cancellationToken)
    {
        dbContext.Clientes.Add(cliente);

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateException ex) when (IsUniqueNitViolation(ex))
        {
            dbContext.Entry(cliente).State = EntityState.Detached;
            return false;
        }
    }

    private static bool IsUniqueNitViolation(DbUpdateException ex) =>
        ex.InnerException is PostgresException
        {
            SqlState: PostgresErrorCodes.UniqueViolation,
            ConstraintName: "uk_clientes_nit",
        };
}
