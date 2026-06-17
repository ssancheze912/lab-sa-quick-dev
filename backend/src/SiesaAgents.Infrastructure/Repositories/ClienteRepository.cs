using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Exceptions;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.Infrastructure.Repositories;

public class ClienteRepository(AppDbContext dbContext) : IClienteRepository
{
    public async Task<List<ClienteEntity>> GetAllAsync()
    {
        return await dbContext.Clientes.ToListAsync();
    }

    public async Task<ClienteEntity?> GetByIdAsync(Guid id)
    {
        return await dbContext.Clientes.FindAsync(id);
    }

    public async Task<ClienteEntity> CreateAsync(ClienteEntity entity)
    {
        await dbContext.Clientes.AddAsync(entity);
        try
        {
            await dbContext.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
        {
            throw new DuplicateNitException(entity.Nit);
        }
        return entity;
    }

    private static bool IsUniqueConstraintViolation(DbUpdateException ex)
    {
        // PostgreSQL error code 23505 = unique_violation
        return ex.InnerException?.Message.Contains("23505") == true
            || ex.InnerException?.Message.Contains("uk_clientes_nit") == true
            || ex.InnerException?.Message.Contains("unique") == true;
    }

    public async Task UpdateAsync(ClienteEntity entity)
    {
        dbContext.Clientes.Update(entity);
        await dbContext.SaveChangesAsync();
    }
}
