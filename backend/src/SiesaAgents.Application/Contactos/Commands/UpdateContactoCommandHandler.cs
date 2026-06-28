using SiesaAgents.Application.Contactos.DTOs;
using SiesaAgents.Domain.Contactos.Interfaces;

namespace SiesaAgents.Application.Contactos.Commands;

public class UpdateContactoCommandHandler(IContactoRepository repository)
{
    public async Task<ContactoDto?> HandleAsync(UpdateContactoCommand command, CancellationToken ct = default)
    {
        var entity = await repository.GetByIdAsync(command.Id, ct);
        if (entity is null)
            return null;

        entity.Update(command.Nombre, command.Cargo, command.Telefono, command.Email);
        await repository.UpdateAsync(entity, ct);
        await repository.SaveChangesAsync(ct);

        return new ContactoDto(
            entity.Id,
            entity.Nombre,
            entity.Cargo,
            entity.Telefono,
            entity.Email,
            entity.ClienteId,
            entity.CreatedAt,
            entity.UpdatedAt);
    }
}
