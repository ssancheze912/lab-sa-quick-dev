using SiesaAgents.Domain.Contactos.Interfaces;

namespace SiesaAgents.Application.Contactos.Commands;

public class DeleteContactoCommandHandler(IContactoRepository repository)
{
    public async Task HandleAsync(DeleteContactoCommand command, CancellationToken ct)
    {
        var entity = await repository.GetByIdAsync(command.Id, ct)
            ?? throw new KeyNotFoundException($"Contacto with id {command.Id} was not found.");

        await repository.DeleteAsync(entity, ct);
    }
}
