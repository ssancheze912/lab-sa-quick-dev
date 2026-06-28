using SiesaAgents.Domain.Contactos.Interfaces;

namespace SiesaAgents.Application.Contactos.Commands;

public class DeleteContactoCommandHandler(IContactoRepository repository)
{
    public async Task<bool> HandleAsync(DeleteContactoCommand command, CancellationToken ct = default)
    {
        var entity = await repository.GetByIdAsync(command.Id, ct);
        if (entity is null)
            return false;

        await repository.DeleteAsync(entity, ct);
        await repository.SaveChangesAsync(ct);
        return true;
    }
}
