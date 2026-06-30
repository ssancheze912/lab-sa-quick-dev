using SiesaAgents.Domain.Clientes.Exceptions;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Commands;

public class DeleteClienteCommandHandler
{
    private readonly IClienteRepository _repository;

    public DeleteClienteCommandHandler(IClienteRepository repository)
    {
        _repository = repository;
    }

    public async Task Handle(DeleteClienteCommand command, CancellationToken ct)
    {
        var deleted = await _repository.DeleteAsync(command.Id, ct);
        if (!deleted)
            throw new NotFoundException($"Cliente with id '{command.Id}' was not found.");
    }
}
