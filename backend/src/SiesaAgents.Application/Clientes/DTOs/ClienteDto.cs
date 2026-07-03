namespace SiesaAgents.Application.Clientes.DTOs;

/// <summary>
/// Transport contract for the client list endpoint (Story 2.1). Field order
/// mirrors <see cref="SiesaAgents.Domain.Clientes.Entities.ClienteEntity"/> so
/// the hand-mapping in <c>GetClientesQueryHandler</c> stays trivial.
/// Serialised as camelCase by default <c>System.Text.Json</c> configuration.
/// </summary>
public record ClienteDto(
    Guid Id,
    string Nombre,
    string NitRuc,
    string Telefono,
    string Ciudad,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
