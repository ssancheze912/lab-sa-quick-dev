using Microsoft.EntityFrameworkCore;
using Npgsql;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Exceptions;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Commands;

/// <summary>
/// Executes the "create cliente" use case:
///   1. Builds a domain entity via ClienteEntity.Create (which trims + enforces
///      NotEmpty invariants — defence-in-depth against a validator gap).
///   2. Persists via IClienteRepository.AddAsync.
///   3. Translates PostgreSQL 23505 (unique_violation on uk_clientes_nit) into
///      a domain-level DuplicateNitException. Any other DbUpdateException
///      bubbles up to ExceptionHandlingMiddleware (500 Problem Details).
/// </summary>
public sealed class CreateClienteCommandHandler
{
    private readonly IClienteRepository _repository;

    public CreateClienteCommandHandler(IClienteRepository repository)
    {
        _repository = repository;
    }

    public async Task<ClienteDto> HandleAsync(
        CreateClienteCommand command,
        CancellationToken cancellationToken = default)
    {
        var entity = ClienteEntity.Create(
            command.Nombre,
            command.Nit,
            command.Telefono,
            command.Ciudad);

        try
        {
            await _repository.AddAsync(entity, cancellationToken);
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
        // Npgsql surfaces PostgreSQL's SQLSTATE via PostgresException.SqlState.
        // 23505 = unique_violation. We also check the constraint name so we
        // don't mis-report unrelated unique violations (defense-in-depth for
        // future indexes on the clientes table).
        return ex.InnerException is PostgresException pg
               && pg.SqlState == "23505"
               && (pg.ConstraintName is null
                   || pg.ConstraintName.Equals("uk_clientes_nit", StringComparison.OrdinalIgnoreCase));
    }
}
