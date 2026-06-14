namespace SiesaAgents.Application.Interfaces;

/// <summary>
/// Generic repository interface for domain entity persistence.
/// </summary>
/// <typeparam name="T">The domain entity type.</typeparam>
public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(T entity, CancellationToken cancellationToken = default);
    void Update(T entity);
    void Remove(T entity);
}
