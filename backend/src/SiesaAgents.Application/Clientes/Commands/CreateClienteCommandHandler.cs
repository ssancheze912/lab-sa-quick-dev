using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Exceptions;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Commands;

/// <summary>
/// Handler for <see cref="CreateClienteCommand"/>. Pre-checks NIT uniqueness via
/// <see cref="IClienteRepository.ExistsByNitAsync"/>, builds a fresh
/// <see cref="ClienteEntity"/> through the factory, persists it, and projects
/// to <see cref="ClienteDto"/> for the API response.
///
/// Throws <see cref="DuplicateNitException"/> when the NIT is already in use —
/// the endpoint catches that exception and emits a 409 Problem Details body.
/// </summary>
public class CreateClienteCommandHandler
{
    private readonly IClienteRepository _repository;

    public CreateClienteCommandHandler(IClienteRepository repository)
        => _repository = repository;

    public async Task<ClienteDto> Handle(CreateClienteCommand command, CancellationToken ct)
    {
        var trimmedNit = command.Nit.Trim();

        if (await _repository.ExistsByNitAsync(trimmedNit, ct))
            throw new DuplicateNitException(trimmedNit);

        var entity = ClienteEntity.Create(
            command.Nombre,
            command.Nit,
            command.Telefono,
            command.Ciudad);

        await _repository.AddAsync(entity, ct);
        await _repository.SaveChangesAsync(ct);

        return new ClienteDto
        {
            Id = entity.Id,
            Nombre = entity.Nombre,
            Nit = entity.Nit,
            Telefono = entity.Telefono,
            Ciudad = entity.Ciudad,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt,
        };
    }
}
