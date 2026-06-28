namespace SiesaAgents.Application.Contactos.DTOs;

public record CreateContactoRequest(string Nombre, string Cargo, string Telefono, string Email, Guid? ClienteId = null);
