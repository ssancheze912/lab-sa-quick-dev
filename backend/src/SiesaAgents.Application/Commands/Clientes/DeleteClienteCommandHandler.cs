using SiesaAgents.Domain.Repositories;

namespace SiesaAgents.Application.Commands.Clientes;

/// <summary>
/// Result of a delete attempt: whether the client was actually deleted (used
/// by the endpoint to decide 204 vs 404), and whether it had associated
/// contacts at the moment of deletion (used to shape the
/// `X-Had-Associated-Contacts` response header — Story 2.5, Task 3).
/// </summary>
public record DeleteClienteResult(bool Deleted, bool HadAssociatedContacts);

public class DeleteClienteCommandHandler(IClienteRepository clienteRepository)
{
    public async Task<DeleteClienteResult> HandleAsync(DeleteClienteCommand command, CancellationToken ct)
    {
        // Contact count is checked BEFORE deleting so the toast-variant signal
        // is known even after the client (and the FK it drives) is gone.
        var contactCount = await clienteRepository.CountContactosByClienteIdAsync(command.Id, ct);

        var deleted = await clienteRepository.DeleteAsync(command.Id, ct);

        return new DeleteClienteResult(deleted, deleted && contactCount > 0);
    }
}
