using SiesaAgents.Application.Clientes.DTOs;

namespace SiesaAgents.Application.Clientes.Queries;

public record GetClientesQuery();

public record GetClientesQueryResult(List<ClienteDto> Clientes);
