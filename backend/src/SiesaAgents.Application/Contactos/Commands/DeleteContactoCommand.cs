namespace SiesaAgents.Application.Contactos.Commands;

public sealed record DeleteContactoCommand(Guid Id);

public interface IDeleteContactoCommandHandler
{
    Task HandleAsync(DeleteContactoCommand command, CancellationToken ct = default);
}
