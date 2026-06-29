using SiesaAgents.Application.Contactos.DTOs;

namespace SiesaAgents.Application.Contactos.Commands;

public sealed record CreateContactoCommand(
    string Nombre,
    string Cargo,
    string Telefono,
    string Email
);

public interface ICreateContactoCommandHandler
{
    Task<ContactoDto> HandleAsync(CreateContactoCommand command, CancellationToken ct = default);
}
