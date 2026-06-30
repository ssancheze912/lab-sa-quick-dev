namespace SiesaAgents.Domain.Clientes.Exceptions;

public class ConflictException : Exception
{
    public ConflictException(string message) : base(message) { }
}
