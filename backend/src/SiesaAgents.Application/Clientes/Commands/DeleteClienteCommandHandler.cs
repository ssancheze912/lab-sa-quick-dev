using FluentValidation;
using SiesaAgents.Domain.Clientes.Exceptions;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Commands;

public class DeleteClienteCommandHandler
{
    private readonly IClienteRepository _repository;
    private readonly IValidator<DeleteClienteCommand> _validator;

    public DeleteClienteCommandHandler(IClienteRepository repository, IValidator<DeleteClienteCommand> validator)
    {
        _repository = repository;
        _validator = validator;
    }

    public async Task Handle(DeleteClienteCommand command, CancellationToken ct)
    {
        await _validator.ValidateAndThrowAsync(command, ct);
        var deleted = await _repository.DeleteAsync(command.Id, ct);
        if (!deleted)
            throw new NotFoundException($"Cliente with id '{command.Id}' was not found.");
    }
}
