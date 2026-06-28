using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Commands;

public record DeleteClienteResult(bool Found, bool HadContacts);

public class DeleteClienteCommandHandler(IClienteRepository repo)
{
    public async Task<DeleteClienteResult> Handle(DeleteClienteCommand command, CancellationToken ct)
    {
        var entity = await repo.GetByIdAsync(command.Id, ct);
        if (entity is null)
            return new DeleteClienteResult(Found: false, HadContacts: false);

        int contactCount = 0;
        try
        {
            contactCount = await repo.CountContactosByClienteIdAsync(command.Id, ct);
        }
        catch
        {
            // Epic 3 dependency: contactos table may not exist yet — treat as 0
            contactCount = 0;
        }

        await repo.DeleteAsync(entity, ct);
        return new DeleteClienteResult(Found: true, HadContacts: contactCount > 0);
    }
}
