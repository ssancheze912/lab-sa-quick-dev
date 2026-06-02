using SiesaAgents.Application.Contactos.DTOs;
using SiesaAgents.Domain.Contactos.Interfaces;

namespace SiesaAgents.Application.Contactos.Commands;

public class AssignClienteToContactoCommandHandler(IContactoRepository repository)
{
    public async Task<ContactoDto> HandleAsync(AssignClienteToContactoCommand command, CancellationToken ct)
    {
        var contacto = await repository.GetByIdAsync(command.ContactoId, ct)
            ?? throw new KeyNotFoundException($"Contacto {command.ContactoId} no encontrado.");

        contacto.AssignClienteId(command.ClienteId);
        await repository.UpdateAsync(contacto, ct);

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
