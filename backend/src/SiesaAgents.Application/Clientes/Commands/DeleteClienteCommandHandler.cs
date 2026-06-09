using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Commands;

public class DeleteClienteCommandHandler(IClienteRepository repository)
{
    public async Task HandleAsync(DeleteClienteCommand command)
    {
        await repository.DeleteAsync(command.Id);
    }
}
