using SiesaAgents.Application.Clientes.DTOs;

namespace SiesaAgents.Application.Clientes.Commands;

public sealed record UpdateClienteCommand(
    Guid Id,
    string Nombre,
    string Nit,
    string Telefono,
    string Ciudad
);

public interface IUpdateClienteCommandHandler
{
    Task<ClienteDto> HandleAsync(UpdateClienteCommand command);
}
