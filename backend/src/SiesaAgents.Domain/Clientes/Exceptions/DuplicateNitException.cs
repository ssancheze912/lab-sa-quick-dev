namespace SiesaAgents.Domain.Clientes.Exceptions;

public class DuplicateNitException : Exception
{
    public DuplicateNitException()
        : base("El NIT/RUC ya está registrado")
    {
    }

    public DuplicateNitException(string nit)
        : base($"El NIT/RUC '{nit}' ya está registrado")
    {
    }
}
