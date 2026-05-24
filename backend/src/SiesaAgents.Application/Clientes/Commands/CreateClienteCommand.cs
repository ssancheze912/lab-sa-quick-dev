using MediatR;
using SiesaAgents.Application.Clientes.DTOs;

namespace SiesaAgents.Application.Clientes.Commands;

public record CreateClienteCommand(
    string Nombre,
    string Nit,
    string Telefono,
    string Ciudad
) : IRequest<ClienteDto>;
