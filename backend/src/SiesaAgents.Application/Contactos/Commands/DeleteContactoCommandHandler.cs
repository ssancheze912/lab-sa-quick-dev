using SiesaAgents.Application.Contactos.Interfaces;

namespace SiesaAgents.Application.Contactos.Commands;

public sealed class ContactoNotFoundException(Guid id)
    : Exception($"Contacto con id {id} no encontrado") { }

public sealed class DeleteContactoCommandHandler(IContactoRepository repository) : IDeleteContactoCommandHandler
{
    public async Task HandleAsync(DeleteContactoCommand command, CancellationToken ct = default)
    {
        var entity = await repository.GetByIdAsync(command.Id, ct);
        if (entity is null)
            throw new ContactoNotFoundException(command.Id);

        await repository.DeleteAsync(entity, ct);
    }
}
