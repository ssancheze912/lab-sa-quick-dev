namespace SiesaAgents.Domain.Clientes.Exceptions;

/// <summary>
/// Thrown by a use case when the requested Cliente does not exist. Mapped to
/// a 404 Problem Details by the endpoint — this is a known, non-exceptional
/// outcome (never leaks stack traces per NFR6).
/// </summary>
public sealed class ClienteNotFoundException : Exception
{
    public Guid Id { get; }

    public ClienteNotFoundException(Guid id)
        : base($"No existe ningún cliente con id {id}.")
    {
        Id = id;
    }
}
