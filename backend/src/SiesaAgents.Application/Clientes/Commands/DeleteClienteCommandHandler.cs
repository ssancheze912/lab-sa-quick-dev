using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Commands;

public sealed class DeleteClienteCommandHandler(IClienteRepository repository)
{
    public async Task<bool> HandleAsync(DeleteClienteCommand command)
    {
        var entity = await repository.GetByIdAsync(command.Id);
        if (entity is null)
            return false;

        return await repository.DeleteAsync(command.Id);
    }
}
