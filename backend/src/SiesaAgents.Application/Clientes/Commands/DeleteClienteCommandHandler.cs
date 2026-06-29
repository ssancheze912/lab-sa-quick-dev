using SiesaAgents.Application.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Commands;

public sealed class DeleteClienteCommandHandler(IClienteRepository repository) : IDeleteClienteCommandHandler
{
    public async Task HandleAsync(DeleteClienteCommand command, CancellationToken ct = default)
    {
        var entity = await repository.GetByIdAsync(command.Id);
        if (entity is null)
            throw new ClienteNotFoundException(command.Id);

        await repository.DeleteAsync(entity, ct);
    }
}
