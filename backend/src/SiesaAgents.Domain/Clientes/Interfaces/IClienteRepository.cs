using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Domain.Clientes.Interfaces;

/// <summary>
/// Persistence contract for the Cliente aggregate. Kept in the Domain layer so
/// Application (Query/Command handlers) depend on abstractions only.
/// </summary>
public interface IClienteRepository
{
    Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns the cliente identified by <paramref name="id"/> or <c>null</c>
    /// when no such record exists. Not-found is a known outcome (mapped to
    /// 404 Problem Details by the handler/endpoint), never an exception.
    /// </summary>
    Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Persists a new cliente. Callers must catch DbUpdateException whose
    /// inner PostgresException.SqlState == "23505" to map duplicate-NIT
    /// violations to a domain-level DuplicateNitException.
    /// </summary>
    Task AddAsync(ClienteEntity cliente, CancellationToken cancellationToken = default);
}
