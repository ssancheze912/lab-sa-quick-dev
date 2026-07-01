using SiesaAgents.Domain.Entities;

namespace SiesaAgents.Domain.Repositories;

/// <summary>
/// Repository contract for `clientes`. Read-only surface established in Story
/// 2.1/2.2; mutation methods (Create) added by Story 2.3. Update/Delete are
/// added by Stories 2.4/2.5.
/// </summary>
public interface IClienteRepository
{
    Task<IReadOnlyList<ClienteEntity>> GetAllAsync(string? searchTerm, CancellationToken ct);

    Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct);

    Task AddAsync(ClienteEntity cliente, CancellationToken ct);

    Task<ClienteEntity?> UpdateAsync(ClienteEntity cliente, CancellationToken ct);

    /// <summary>
    /// Deletes the client with the given <paramref name="id"/>. Returns
    /// <c>false</c> (no exception) if no client with that id exists — the
    /// 404 case. Associated `contactos` are orphaned (`cliente_id = NULL`)
    /// by the database's `ON DELETE SET NULL` FK behavior (Story 2.5, R2),
    /// never cascade-deleted or nulled out via application code.
    /// </summary>
    Task<bool> DeleteAsync(Guid id, CancellationToken ct);

    /// <summary>
    /// Counts `contactos` associated with the given client, used only to
    /// decide which of the two delete-success toast variants applies
    /// (Story 2.5, AC #2 vs #3) — a narrow, story-scoped read, not a
    /// replacement for the full `IContactoRepository` Epic 3 will introduce.
    /// </summary>
    Task<int> CountContactosByClienteIdAsync(Guid clienteId, CancellationToken ct);
}
