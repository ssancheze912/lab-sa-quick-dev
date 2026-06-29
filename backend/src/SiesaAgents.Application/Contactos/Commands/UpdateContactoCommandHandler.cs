using SiesaAgents.Application.Contactos.DTOs;
using SiesaAgents.Application.Contactos.Interfaces;

namespace SiesaAgents.Application.Contactos.Commands;

public sealed class UpdateContactoCommandHandler(IContactoRepository repository) : IUpdateContactoCommandHandler
{
    public async Task<ContactoDto?> HandleAsync(UpdateContactoCommand command, CancellationToken ct = default)
    {
        var contacto = await repository.GetByIdAsync(command.Id, ct);

        if (contacto is null)
            return null;

        contacto.Update(command.Nombre, command.Cargo, command.Telefono, command.Email);
        await repository.UpdateAsync(contacto, ct);
        await repository.SaveChangesAsync(ct);

        return new ContactoDto(
            contacto.Id,
            contacto.Nombre,
            contacto.Cargo,
            contacto.Telefono,
            contacto.Email,
            contacto.ClienteId,
            contacto.CreatedAt,
            contacto.UpdatedAt
        );
    }
}
