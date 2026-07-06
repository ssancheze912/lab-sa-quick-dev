using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Commands;

public class CreateClienteCommandHandler(IClienteRepository clienteRepository)
{
    public async Task<CreateClienteResult> Handle(CreateClienteCommand command, CancellationToken cancellationToken)
    {
        var cliente = ClienteEntity.Create(command.Nombre, command.Nit, command.Telefono, command.Ciudad);

        var added = await clienteRepository.AddAsync(cliente, cancellationToken);

        if (!added)
        {
            return CreateClienteResult.Conflict();
        }

        var dto = new ClienteDto(cliente.Id, cliente.Nombre, cliente.Nit, cliente.Telefono, cliente.Ciudad, cliente.CreatedAt);

        return CreateClienteResult.Success(dto);
    }
}
