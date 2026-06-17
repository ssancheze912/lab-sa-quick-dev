using System.Text.Json.Serialization;

namespace SiesaAgents.Application.Clientes.DTOs;

public record ClienteDto(
    Guid Id,
    string Nombre,
    [property: JsonPropertyName("nitRuc")] string NitRuc,
    string Telefono,
    string Ciudad,
    DateTimeOffset CreatedAt
);
