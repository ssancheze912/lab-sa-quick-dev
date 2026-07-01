using SiesaAgents.Application.DTOs;
using SiesaAgents.Domain.Entities;
using SiesaAgents.Domain.Repositories;

namespace SiesaAgents.Application.Commands.Contactos;

public class CreateContactoCommandHandler(IContactoRepository contactoRepository)
{
    public async Task<ContactoDto> HandleAsync(CreateContactoCommand command, CancellationToken ct)
    {
        var contacto = ContactoEntity.Create(command.Nombre, command.Cargo, command.Telefono, command.Email, clienteId: null);

        await contactoRepository.AddAsync(contacto, ct);

        return new ContactoDto(contacto.Id, contacto.Nombre, contacto.Cargo, contacto.Telefono, contacto.Email, contacto.ClienteId, contacto.CreatedAt);
    }
}
