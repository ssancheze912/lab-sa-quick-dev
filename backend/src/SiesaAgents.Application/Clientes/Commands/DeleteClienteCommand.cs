using MediatR;

namespace SiesaAgents.Application.Clientes.Commands;

public record DeleteClienteCommand(Guid Id) : IRequest;
