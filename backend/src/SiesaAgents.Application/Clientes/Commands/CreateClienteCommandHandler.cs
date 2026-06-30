using FluentValidation;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Exceptions;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Commands;

public class CreateClienteCommandHandler
{
    private readonly IClienteRepository _repository;
    private readonly IValidator<CreateClienteCommand> _validator;

    public CreateClienteCommandHandler(IClienteRepository repository, IValidator<CreateClienteCommand> validator)
    {
        _repository = repository;
        _validator = validator;
    }

    public async Task<ClienteDto> Handle(CreateClienteCommand command, CancellationToken ct)
    {
        await _validator.ValidateAndThrowAsync(command, ct);

        if (await _repository.ExistsByNitAsync(command.Nit, ct))
            throw new ConflictException("El NIT/RUC ya está registrado");

        var cliente = ClienteEntity.Create(
            command.Nombre,
            command.Nit,
            command.Telefono,
            command.Ciudad
        );

        var created = await _repository.CreateAsync(cliente, ct);

        return new ClienteDto(
            created.Id,
            created.Nombre,
            created.Nit,
            created.Telefono,
            created.Ciudad,
            created.CreatedAt,
            created.UpdatedAt
        );
    }
}
