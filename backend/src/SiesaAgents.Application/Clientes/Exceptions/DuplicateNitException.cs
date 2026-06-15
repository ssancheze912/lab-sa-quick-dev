namespace SiesaAgents.Application.Clientes.Exceptions;

/// <summary>
/// Thrown by <c>CreateClienteCommandHandler</c> when an attempt is made to
/// persist a cliente whose NIT already exists. Caught in the minimal-API
/// endpoint and translated to a 409 Problem Details response.
/// The message string is intentionally Spanish and end-user safe.
/// </summary>
public sealed class DuplicateNitException : Exception
{
    public string Nit { get; }

    public DuplicateNitException(string nit)
        : base($"El NIT/RUC '{nit}' ya está registrado.")
    {
        Nit = nit;
    }
}
