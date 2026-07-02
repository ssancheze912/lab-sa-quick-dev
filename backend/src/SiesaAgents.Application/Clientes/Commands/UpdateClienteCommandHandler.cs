using Microsoft.EntityFrameworkCore;
using Npgsql;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Exceptions;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Commands;

/// <summary>
/// Executes the "update cliente" use case:
///   1. Fetches the entity by id — <see cref="ClienteNotFoundException"/>
///      when null (mapped to 404 by the endpoint).
///   2. Applies the domain mutation via <see cref="Domain.Clientes.Entities.ClienteEntity.Update"/>
///      (which trims + enforces NotEmpty invariants — defence-in-depth
///      against a validator gap and refreshes UpdatedAt).
///   3. Persists via IClienteRepository.UpdateAsync.
///   4. Translates PostgreSQL 23505 (unique_violation on uk_clientes_nit)
///      into a domain-level DuplicateNitException (reused from Story 2.3).
///      Any other DbUpdateException bubbles up to
///      ExceptionHandlingMiddleware (500 Problem Details).
/// </summary>
public sealed class UpdateClienteCommandHandler
{
    private readonly IClienteRepository _repository;

    public UpdateClienteCommandHandler(IClienteRepository repository)
    {
        _repository = repository;
    }

    public async Task<ClienteDto> HandleAsync(
        UpdateClienteCommand command,
        CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetByIdAsync(command.Id, cancellationToken)
            ?? throw new ClienteNotFoundException(command.Id);

        entity.Update(
            command.Nombre,
            command.Nit,
            command.Telefono,
            command.Ciudad);

        try
        {
            await _repository.UpdateAsync(entity, cancellationToken);
        }
        catch (DbUpdateException ex) when (IsUniqueNitViolation(ex))
        {
            throw new DuplicateNitException(entity.Nit);
        }

        return new ClienteDto(
            entity.Id,
            entity.Nombre,
            entity.Nit,
            entity.Telefono,
            entity.Ciudad,
            entity.CreatedAt,
            entity.UpdatedAt);
    }

    private static bool IsUniqueNitViolation(DbUpdateException ex)
    {
        return ex.InnerException is PostgresException pg
               && pg.SqlState == "23505"
               && (pg.ConstraintName is null
                   || pg.ConstraintName.Equals("uk_clientes_nit", StringComparison.OrdinalIgnoreCase));
    }
}
