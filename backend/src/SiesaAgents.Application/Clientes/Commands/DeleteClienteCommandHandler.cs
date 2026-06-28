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

        var contactCount = await repo.CountContactosByClienteIdAsync(command.Id, ct);

        await repo.DeleteAsync(entity, ct);
        return new DeleteClienteResult(Found: true, HadContacts: contactCount > 0);
    }
}
