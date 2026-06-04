namespace SiesaAgents.Application.Interfaces;

/// <summary>
/// Unit of Work pattern interface for coordinating writes.
/// </summary>
public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
