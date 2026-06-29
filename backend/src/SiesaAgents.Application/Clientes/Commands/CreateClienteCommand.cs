using SiesaAgents.Application.Clientes.DTOs;

namespace SiesaAgents.Application.Clientes.Commands;

public sealed record CreateClienteCommand(
    string Nombre,
    string Nit,
    string Telefono,
    string Ciudad
);

public interface ICreateClienteCommandHandler
{
    Task<ClienteDto> HandleAsync(CreateClienteCommand command);
}
