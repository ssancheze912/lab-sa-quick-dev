using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Exceptions;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Commands;

/// <summary>
/// Application-layer handler for <see cref="UpdateClienteCommand"/> (Story 2.4).
///
/// Runs the "unique-NIT-excluding-self" check BEFORE mutating the entity
/// (defence-in-depth against races — the DB unique index remains as a second
/// line of defence). Returns null when the row does not exist so the endpoint
/// can translate that to 404 (AC #11).
/// </summary>
public sealed class UpdateClienteCommandHandler
{
    private readonly IClienteRepository _repository;

    public UpdateClienteCommandHandler(IClienteRepository repository)
    {
        _repository = repository;
    }

    public async Task<ClienteDto?> HandleAsync(UpdateClienteCommand command, CancellationToken ct)
    {
        var request = command.Request;

        var entity = await _repository.GetByIdAsync(command.Id, ct);
        if (entity is null)
        {
            // Endpoint maps to 404 (AC #11).
            return null;
        }

        if (await _repository.NitExistsForAnotherAsync(command.Id, request.Nit, ct))
        {
            // Application-level defence-in-depth (AC #12, R-002) — DB unique
            // index remains as a second line of defence.
            throw new ClienteNitConflictException(request.Nit);
        }

        entity.Update(request.Nombre, request.Nit, request.Telefono, request.Ciudad);
        await _repository.UpdateAsync(entity, ct);

        return new ClienteDto(
            entity.Id,
            entity.Nombre,
            entity.Nit,
            entity.Telefono,
            entity.Ciudad,
            entity.CreatedAt,
            entity.UpdatedAt);
    }
}
