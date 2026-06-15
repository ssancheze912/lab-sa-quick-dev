using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Exceptions;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Commands;

/// <summary>
/// Handler for <see cref="UpdateClienteCommand"/>. Story 2.4.
///
/// Flow:
///   1. Load the tracked entity by id; if null → return null so the endpoint can
///      translate to 404 Problem Details (mirrors Story 2.2 GetById pattern).
///   2. Run the "NIT uniqueness EXCEPT self" check so editing without changing
///      the NIT cannot raise a false-positive 409 (AC #8).
///   3. Call the existing <c>ClienteEntity.Update(...)</c> method which bumps
///      <c>UpdatedAt</c> and applies trimming/null-coalescing.
///   4. Flush via <c>SaveChangesAsync</c> and project to <c>ClienteDto</c>.
/// </summary>
public class UpdateClienteCommandHandler
{
    private readonly IClienteRepository _repository;

    public UpdateClienteCommandHandler(IClienteRepository repository)
        => _repository = repository;

    public async Task<ClienteDto?> Handle(UpdateClienteCommand command, CancellationToken ct)
    {
        var entity = await _repository.GetByIdForUpdateAsync(command.Id, ct);
        if (entity is null) return null;

        var trimmedNit = command.Nit.Trim();

        // AC #8 — exclude the current cliente's id so editing without changing
        // the NIT does NOT raise a false-positive 409.
        if (await _repository.ExistsByNitExceptIdAsync(trimmedNit, command.Id, ct))
            throw new DuplicateNitException(trimmedNit);

        entity.Update(
            command.Nombre,
            command.Nit,
            command.Telefono,
            command.Ciudad);

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
