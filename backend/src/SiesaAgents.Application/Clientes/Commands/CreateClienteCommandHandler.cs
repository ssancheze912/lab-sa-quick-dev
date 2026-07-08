using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Exceptions;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Commands;

/// <summary>
/// Application-layer handler for <see cref="CreateClienteCommand"/> (Story 2.3).
///
/// Runs the application-level NIT uniqueness check BEFORE calling
/// <see cref="IClienteRepository.AddAsync"/> to keep 409 responses deterministic
/// (defence-in-depth against races — the DB unique index remains as a second
/// line of defence).
/// </summary>
public sealed class CreateClienteCommandHandler
{
    private readonly IClienteRepository _repository;

    public CreateClienteCommandHandler(IClienteRepository repository)
    {
        _repository = repository;
    }

    public async Task<ClienteDto> HandleAsync(CreateClienteCommand command, CancellationToken ct)
    {
        var request = command.Request;

        if (await _repository.NitExistsAsync(request.Nit, ct))
        {
            throw new ClienteNitConflictException(request.Nit);
        }

        var entity = ClienteEntity.Create(
            request.Nombre,
            request.Nit,
            request.Telefono,
            request.Ciudad);

        await _repository.AddAsync(entity, ct);

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
