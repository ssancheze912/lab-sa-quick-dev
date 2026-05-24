using MediatR;
using SiesaAgents.Application.Clientes.DTOs;

namespace SiesaAgents.Application.Clientes.Queries;

public record GetClientesQuery : IRequest<IEnumerable<ClienteDto>>;
