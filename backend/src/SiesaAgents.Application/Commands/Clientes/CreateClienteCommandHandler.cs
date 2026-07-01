using SiesaAgents.Application.DTOs;
using SiesaAgents.Domain.Entities;
using SiesaAgents.Domain.Repositories;

namespace SiesaAgents.Application.Commands.Clientes;

public class CreateClienteCommandHandler(IClienteRepository clienteRepository)
{
    public async Task<ClienteDto> HandleAsync(CreateClienteCommand command, CancellationToken ct)
    {
        var cliente = ClienteEntity.Create(command.Nombre, command.Nit, command.Telefono, command.Ciudad);

        await clienteRepository.AddAsync(cliente, ct);

        return new ClienteDto(cliente.Id, cliente.Nombre, cliente.Nit, cliente.Telefono, cliente.Ciudad, cliente.CreatedAt);
    }
}
