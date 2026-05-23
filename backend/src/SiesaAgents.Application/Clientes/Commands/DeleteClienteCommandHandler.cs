using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Commands;

public class DeleteClienteCommandHandler
{
    private readonly IClienteRepository _repository;

    public DeleteClienteCommandHandler(IClienteRepository repository)
    {
        _repository = repository;
    }

    /// <summary>
    /// Deletes a cliente by ID.
    /// Throws KeyNotFoundException if the client does not exist.
    /// </summary>
    public async Task HandleAsync(DeleteClienteCommand command, CancellationToken ct)
    {
        var cliente = await _repository.GetByIdAsync(command.Id, ct)
            ?? throw new KeyNotFoundException($"No existe un cliente con id '{command.Id}'.");

        await _repository.DeleteAsync(command.Id, ct);
    }
}
