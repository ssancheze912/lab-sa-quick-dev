using SiesaAgents.Application.Contactos.DTOs;
using SiesaAgents.Application.Contactos.Interfaces;
using SiesaAgents.Domain.Entities;

namespace SiesaAgents.Application.Contactos.Commands;

public sealed class CreateContactoCommandHandler(IContactoRepository repository) : ICreateContactoCommandHandler
{
    public async Task<ContactoDto> HandleAsync(CreateContactoCommand command, CancellationToken ct = default)
    {
        var entity = ContactoEntity.Create(
            command.Nombre,
            command.Cargo,
            command.Telefono,
            command.Email
        );

        await repository.AddAsync(entity, ct);
        await repository.SaveChangesAsync(ct);

        return new ContactoDto(
            entity.Id,
            entity.Nombre,
            entity.Cargo,
            entity.Telefono,
            entity.Email,
            entity.ClienteId,
            entity.CreatedAt,
            entity.UpdatedAt
        );
    }
}
