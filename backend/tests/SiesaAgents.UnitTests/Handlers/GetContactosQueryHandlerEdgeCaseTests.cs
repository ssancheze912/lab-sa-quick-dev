using SiesaAgents.Application.Contactos.Queries;
using SiesaAgents.Domain.Contactos.Entities;
using SiesaAgents.Domain.Contactos.Interfaces;

namespace SiesaAgents.UnitTests.Handlers;

/// <summary>
/// Edge case unit tests for GetContactosQueryHandler — Story 3.1 expansion.
///
/// Test IDs: UNIT-B-CT-GET-EDGE-01 … UNIT-B-CT-GET-EDGE-05
///
/// Risks covered:
///   - Handler maps all DTO fields including Telefono, ClienteId
///   - Handler maps CreatedAt and UpdatedAt as DateTimeOffset (timezone offset present)
///   - Handler propagates exception thrown by repository (error path)
///   - Handler with large number of contacts returns all items (no accidental paging)
///   - Handler maps ClienteId as null when entity has no associated client (Epic 3 scope)
/// </summary>
public class GetContactosQueryHandlerEdgeCaseTests
{
    // ---------------------------------------------------------------------------
    // UNIT-B-CT-GET-EDGE-01: Handler maps ALL DTO fields including Telefono and Email
    // Boundary: ATDD tests only asserted Nombre and Email. Telefono must also map.
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task HandleAsync_WithContacto_MapsAllFieldsIncludingTelefono()
    {
        // Arrange
        var contacto = ContactoEntity.Create(
            "Verificar Mapeo",
            "Cargo Test",
            "+57 310 000 0001",
            "verificar@test.co"
        );
        var repository = new FakeContactoRepository(new List<ContactoEntity> { contacto });
        var handler = new GetContactosQueryHandler(repository);

        // Act
        var result = (await handler.HandleAsync(new GetContactosQuery(), CancellationToken.None)).ToList();

        // Assert
        Assert.Single(result);
        Assert.Equal("Verificar Mapeo", result[0].Nombre);
        Assert.Equal("Cargo Test", result[0].Cargo);
        Assert.Equal("+57 310 000 0001", result[0].Telefono);
        Assert.Equal("verificar@test.co", result[0].Email);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-CT-GET-EDGE-02: Handler maps CreatedAt and UpdatedAt as DateTimeOffset
    // Boundary: These fields MUST be DateTimeOffset (with Offset property), not DateTime.
    // This guards against accidental use of DateTime in a future refactor.
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task HandleAsync_WithContacto_MapsCreatedAtAndUpdatedAtAsDateTimeOffset()
    {
        // Arrange
        var entity = ContactoEntity.Create("Empresa Beta", "Cargo", "+57 310 000 0002", "beta@test.co");
        var repository = new FakeContactoRepository(new List<ContactoEntity> { entity });
        var handler = new GetContactosQueryHandler(repository);

        // Act
        var result = (await handler.HandleAsync(new GetContactosQuery(), CancellationToken.None)).ToList();

        // Assert — DateTimeOffset.UtcNow has Offset = TimeSpan.Zero
        Assert.Equal(TimeSpan.Zero, result[0].CreatedAt.Offset);
        Assert.Equal(TimeSpan.Zero, result[0].UpdatedAt.Offset);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-CT-GET-EDGE-03: Handler propagates exception thrown by repository
    // Error path: if the DB call fails, the exception must surface to the caller.
    // This ensures the application layer does not swallow infrastructure errors.
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task HandleAsync_RepositoryThrows_PropagatesException()
    {
        // Arrange
        var repository = new ThrowingContactoRepository(new Exception("DB connection lost"));
        var handler = new GetContactosQueryHandler(repository);

        // Act & Assert
        await Assert.ThrowsAsync<Exception>(
            () => handler.HandleAsync(new GetContactosQuery(), CancellationToken.None));
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-CT-GET-EDGE-04: Handler with large number of contacts returns all items
    // Boundary: no accidental paging or result limiting inside the handler.
    // NFR1 requires supporting up to 1,000 records.
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task HandleAsync_WithManyContactos_ReturnsAllItems()
    {
        // Arrange
        var contactos = Enumerable.Range(1, 100)
            .Select(i => ContactoEntity.Create(
                $"Contacto {i}",
                "Cargo Test",
                $"+57 310 000 {i:D4}",
                $"contacto{i}@empresa.co"
            ))
            .ToList();
        var repository = new FakeContactoRepository(contactos);
        var handler = new GetContactosQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetContactosQuery(), CancellationToken.None);

        // Assert
        Assert.Equal(100, result.Count());
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-CT-GET-EDGE-05: Handler maps ClienteId as null for Epic-3 contacts
    // Boundary: ContactoEntity.Create sets ClienteId = null by default.
    // This guards Epic 3 scope boundary — ClienteId must remain null until Epic 4.
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task HandleAsync_WithContacto_MapsClienteIdAsNull()
    {
        // Arrange — ContactoEntity.Create always sets ClienteId = null
        var contacto = ContactoEntity.Create(
            "Sin Cliente",
            "Analista",
            "+57 310 000 0005",
            "sincliente@empresa.co"
        );
        var repository = new FakeContactoRepository(new List<ContactoEntity> { contacto });
        var handler = new GetContactosQueryHandler(repository);

        // Act
        var result = (await handler.HandleAsync(new GetContactosQuery(), CancellationToken.None)).ToList();

        // Assert
        Assert.Single(result);
        Assert.Null(result[0].ClienteId);
    }

    // ---------------------------------------------------------------------------
    // Fake implementations
    // ---------------------------------------------------------------------------

    private sealed class FakeContactoRepository : IContactoRepository
    {
        private readonly IEnumerable<ContactoEntity> _data;

        public FakeContactoRepository(IEnumerable<ContactoEntity> data) => _data = data;

        public Task<IEnumerable<ContactoEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult(_data);

        public Task<ContactoEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromResult(_data.FirstOrDefault(c => c.Id == id));

        public Task<IEnumerable<ContactoEntity>> GetByClienteIdAsync(Guid clienteId, CancellationToken ct)
            => Task.FromResult(_data.Where(c => c.ClienteId == clienteId));

        public Task<IEnumerable<ContactoEntity>> GetOrphanAsync(CancellationToken ct)
            => Task.FromResult(_data.Where(c => c.ClienteId == null));

        public Task<ContactoEntity> CreateAsync(ContactoEntity entity, CancellationToken ct)
            => Task.FromResult(entity);

        public Task<ContactoEntity> UpdateAsync(ContactoEntity entity, CancellationToken ct)
            => Task.FromResult(entity);

        public Task DeleteAsync(ContactoEntity entity, CancellationToken ct)
            => Task.CompletedTask;
    }

    private sealed class ThrowingContactoRepository : IContactoRepository
    {
        private readonly Exception _exception;

        public ThrowingContactoRepository(Exception exception) => _exception = exception;

        public Task<IEnumerable<ContactoEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromException<IEnumerable<ContactoEntity>>(_exception);

        public Task<ContactoEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromException<ContactoEntity?>(_exception);

        public Task<IEnumerable<ContactoEntity>> GetByClienteIdAsync(Guid clienteId, CancellationToken ct)
            => Task.FromException<IEnumerable<ContactoEntity>>(_exception);

        public Task<IEnumerable<ContactoEntity>> GetOrphanAsync(CancellationToken ct)
            => Task.FromException<IEnumerable<ContactoEntity>>(_exception);

        public Task<ContactoEntity> CreateAsync(ContactoEntity entity, CancellationToken ct)
            => Task.FromException<ContactoEntity>(_exception);

        public Task<ContactoEntity> UpdateAsync(ContactoEntity entity, CancellationToken ct)
            => Task.FromException<ContactoEntity>(_exception);

        public Task DeleteAsync(ContactoEntity entity, CancellationToken ct)
            => Task.FromException(_exception);
    }
}
