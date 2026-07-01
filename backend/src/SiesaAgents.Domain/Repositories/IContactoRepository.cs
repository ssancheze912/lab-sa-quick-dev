using SiesaAgents.Domain.Entities;

namespace SiesaAgents.Domain.Repositories;

/// <summary>
/// Repository contract for `contactos`. Read-only surface established in
/// Story 3.1 (Contact List & Search) on top of the `ContactoEntity`/table
/// already introduced by Story 2.5. Create/Update/Delete/GetById are added by
/// Stories 3.2/3.3/3.4/3.5 — kept out of scope here.
/// </summary>
public interface IContactoRepository
{
    Task<IReadOnlyList<ContactoEntity>> GetAllAsync(string? searchTerm, CancellationToken ct);
}
