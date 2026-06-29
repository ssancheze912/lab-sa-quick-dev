using SiesaAgents.Application.Contactos.DTOs;
using SiesaAgents.Application.Contactos.Interfaces;

namespace SiesaAgents.Application.Contactos.Commands;

public sealed class AssignClienteCommandHandler(IContactoRepository repository) : IAssignClienteCommandHandler
{
    public async Task<ContactoDto?> HandleAsync(AssignClienteCommand command, CancellationToken ct = default)
    {
        var contacto = await repository.GetByIdAsync(command.ContactoId, ct);

        if (contacto is null)
            return null;

        contacto.AssignCliente(command.ClienteId);
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
