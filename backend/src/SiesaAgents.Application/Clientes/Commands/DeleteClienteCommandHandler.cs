using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Commands;

public class DeleteClienteCommandHandler(IClienteRepository clienteRepository)
{
    public Task<bool> Handle(DeleteClienteCommand command, CancellationToken cancellationToken) =>
        clienteRepository.DeleteAsync(command.Id, cancellationToken);
}
