namespace SiesaAgents.Domain.Clientes.Exceptions;

/// <summary>
/// Thrown when an attempt to persist a Cliente violates the uk_clientes_nit
/// unique constraint. It is a known outcome (mapped to 409 Problem Details
/// by the endpoint), not a technical failure — no stack trace is exposed.
/// </summary>
public sealed class DuplicateNitException : Exception
{
    public string Nit { get; }

    public DuplicateNitException(string nit)
        : base($"Ya existe un cliente con NIT/RUC '{nit}'.")
    {
        Nit = nit;
    }
}
