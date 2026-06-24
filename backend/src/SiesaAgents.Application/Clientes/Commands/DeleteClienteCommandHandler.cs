using SiesaAgents.Application.Clientes.Interfaces;
using SiesaAgents.Domain.Exceptions;

namespace SiesaAgents.Application.Clientes.Commands;

public class DeleteClienteCommandHandler(IClienteRepository repository)
{
    public async Task HandleAsync(DeleteClienteCommand command, CancellationToken ct = default)
    {
        var entity = await repository.GetByIdAsync(command.Id, ct)
            ?? throw new NotFoundException($"Cliente {command.Id} not found.");

        await repository.DeleteAsync(entity, ct);
        await repository.SaveChangesAsync(ct);
    }
}
