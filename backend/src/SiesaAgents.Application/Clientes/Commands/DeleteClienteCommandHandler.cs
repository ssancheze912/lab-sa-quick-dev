using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Commands;

/// <summary>
/// Handler for <see cref="DeleteClienteCommand"/>. Story 2.5.
///
/// Flow:
///   1. Load the tracked entity via <see cref="IClienteRepository.GetByIdForUpdateAsync"/>
///      (the existing tracking variant from Story 2.4 — reuse, NO churn).
///   2. If null → return <c>(deleted: false, contactosOrphaned: 0)</c> so the endpoint
///      can translate to 404 Problem Details.
///   3. Call <c>_repository.RemoveAsync(entity)</c> + <c>SaveChangesAsync</c>.
///   4. Return <c>(deleted: true, contactosOrphaned: 0)</c> for Story 2.5. Story 3.x
///      will overload this return to expose the actual orphan count when the
///      <c>contactos</c> table lands (the FK cascade-SET-NULL contract is declared
///      at the schema level — see Dev Notes "Contactos Coupling Strategy").
/// </summary>
public class DeleteClienteCommandHandler
{
    private readonly IClienteRepository _repository;

    public DeleteClienteCommandHandler(IClienteRepository repository)
        => _repository = repository;

    public async Task<DeleteClienteResult> Handle(DeleteClienteCommand command, CancellationToken ct)
    {
        var entity = await _repository.GetByIdForUpdateAsync(command.Id, ct);
        if (entity is null)
            return new DeleteClienteResult(Deleted: false, ContactosOrphaned: 0);

        await _repository.RemoveAsync(entity, ct);
        await _repository.SaveChangesAsync(ct);

        // ContactosOrphaned stays at 0 until Story 3.x adds the contactos table
        // and the cascade-SetNull behavior surfaces a real count here.
        return new DeleteClienteResult(Deleted: true, ContactosOrphaned: 0);
    }
}

public record DeleteClienteResult(bool Deleted, int ContactosOrphaned);
