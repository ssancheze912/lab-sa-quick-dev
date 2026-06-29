using SiesaAgents.Application.Contactos.DTOs;

namespace SiesaAgents.Application.Contactos.Commands;

public sealed record UpdateContactoCommand(
    Guid Id,
    string Nombre,
    string Cargo,
    string Telefono,
    string Email
);

public interface IUpdateContactoCommandHandler
{
    Task<ContactoDto?> HandleAsync(UpdateContactoCommand command, CancellationToken ct = default);
}
