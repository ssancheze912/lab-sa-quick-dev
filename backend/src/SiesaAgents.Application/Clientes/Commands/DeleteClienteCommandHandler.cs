using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Commands;

public class DeleteClienteCommandHandler
{
    private readonly IClienteRepository _repository;

    public DeleteClienteCommandHandler(IClienteRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> Handle(DeleteClienteCommand command, CancellationToken ct)
    {
        return await _repository.DeleteAsync(command.Id, ct);
    }
}
