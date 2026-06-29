using SiesaAgents.Application.Contactos.DTOs;

namespace SiesaAgents.Application.Contactos.Commands;

public sealed record AssignClienteCommand(Guid ContactoId, Guid? ClienteId);

public interface IAssignClienteCommandHandler
{
    Task<ContactoDto?> HandleAsync(AssignClienteCommand command, CancellationToken ct = default);
}
