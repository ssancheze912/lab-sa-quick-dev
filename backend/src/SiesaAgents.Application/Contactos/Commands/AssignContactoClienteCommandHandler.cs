using SiesaAgents.Application.Contactos.DTOs;
using SiesaAgents.Domain.Contactos.Interfaces;

namespace SiesaAgents.Application.Contactos.Commands;

public class AssignContactoClienteCommandHandler(IContactoRepository repository)
{
    public async Task<ContactoDto?> HandleAsync(AssignContactoClienteCommand command, CancellationToken ct = default)
    {
        var contacto = await repository.GetByIdAsync(command.ContactoId, ct);
        if (contacto is null)
            return null;

        contacto.AssignCliente(command.ClienteId);
        await repository.SaveChangesAsync(ct);

        return new ContactoDto(
            contacto.Id,
            contacto.Nombre,
            contacto.Cargo,
            contacto.Telefono,
            contacto.Email,
            contacto.ClienteId,
            contacto.CreatedAt,
            contacto.UpdatedAt);
    }
}
