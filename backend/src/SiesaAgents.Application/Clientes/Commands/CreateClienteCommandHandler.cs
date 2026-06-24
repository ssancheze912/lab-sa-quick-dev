using Microsoft.EntityFrameworkCore;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Interfaces;
using SiesaAgents.Domain.Entities;
using SiesaAgents.Domain.Exceptions;

namespace SiesaAgents.Application.Clientes.Commands;

public class CreateClienteCommandHandler(IClienteRepository repository)
{
    public async Task<ClienteDto> HandleAsync(CreateClienteCommand command, CancellationToken ct = default)
    {
        var entity = ClienteEntity.Create(command.Nombre, command.Nit, command.Telefono, command.Ciudad);

        try
        {
            await repository.AddAsync(entity, ct);
            await repository.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("uk_clientes_nit") == true)
        {
            throw new ConflictException("El NIT/RUC ya está registrado.");
        }

        return new ClienteDto(
            entity.Id,
            entity.Nombre,
            entity.Nit,
            entity.Telefono,
            entity.Ciudad,
            entity.CreatedAt,
            entity.UpdatedAt);
    }
}
