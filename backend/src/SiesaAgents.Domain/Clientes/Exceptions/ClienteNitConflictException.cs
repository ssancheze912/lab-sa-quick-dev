namespace SiesaAgents.Domain.Clientes.Exceptions;

/// <summary>
/// Thrown when an attempt to create a Cliente collides with an existing
/// NIT/RUC (uniqueness violation — FR7). The exception message is the
/// developer-facing default; the user-facing Spanish string is set by the
/// <c>ExceptionHandlingMiddleware</c> (Story 2.3).
/// </summary>
public sealed class ClienteNitConflictException : Exception
{
    public string Nit { get; }

    public ClienteNitConflictException(string nit)
        : base($"A cliente with NIT '{nit}' already exists.")
    {
        Nit = nit;
    }
}
