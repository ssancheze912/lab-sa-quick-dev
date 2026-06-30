using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Commands;

public class CreateClienteCommandHandler
{
    private readonly IClienteRepository _repository;

    public CreateClienteCommandHandler(IClienteRepository repository)
    {
        _repository = repository;
    }

    public async Task<ClienteDto> Handle(CreateClienteCommand command, CancellationToken ct)
    {
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
