namespace SiesaAgents.Application.Clientes.Commands;

public sealed record DeleteClienteCommand(Guid Id);

public interface IDeleteClienteCommandHandler
{
    Task HandleAsync(DeleteClienteCommand command, CancellationToken ct = default);
}
