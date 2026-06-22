using SiesaAgents.Application.Contactos.Queries;
using SiesaAgents.Domain.Contactos.Entities;
using SiesaAgents.Domain.Contactos.Interfaces;

namespace SiesaAgents.UnitTests.Handlers;

/// <summary>
/// Unit tests for GetContactosByClienteIdQueryHandler — Story 4.1.
///
/// Test IDs: UNIT-B-CT-BYCLIENT-01 … UNIT-B-CT-BYCLIENT-04
/// </summary>
public class GetContactosByClienteIdQueryHandlerTests
{
    // ---------------------------------------------------------------------------
    // UNIT-B-CT-BYCLIENT-01: Returns only contacts matching the requested clienteId
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task HandleAsync_WithMultipleClients_ReturnsOnlyMatchingClientContacts()
    {
        // Arrange
        var targetClienteId = Guid.NewGuid();
        var otherClienteId = Guid.NewGuid();

        var contactos = new List<ContactoEntity>
        {
            ContactoEntity.Create("María García", "Gerente", "+57 1 234 5679", "m.garcia@empresa.com", targetClienteId),
            ContactoEntity.Create("Juan Pérez", "Analista", "+57 1 234 5680", "j.perez@empresa.com", targetClienteId),
            ContactoEntity.Create("Pedro López", "Director", "+57 1 234 5681", "p.lopez@otro.com", otherClienteId),
        };
        var repository = new FakeContactoRepository(contactos);
        var handler = new GetContactosByClienteIdQueryHandler(repository);

        // Act
        var result = (await handler.HandleAsync(new GetContactosByClienteIdQuery(targetClienteId), CancellationToken.None)).ToList();

        // Assert — only 2 contacts for the target client
        Assert.Equal(2, result.Count);
        Assert.All(result, dto => Assert.Equal(targetClienteId, dto.ClienteId));
        Assert.DoesNotContain(result, dto => dto.Email == "p.lopez@otro.com");
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-CT-BYCLIENT-02: Returns empty collection when client has no contacts
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task HandleAsync_WithNoContactsForClient_ReturnsEmptyCollection()
    {
        // Arrange
        var clienteId = Guid.NewGuid();
        var repository = new FakeContactoRepository(new List<ContactoEntity>());
        var handler = new GetContactosByClienteIdQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetContactosByClienteIdQuery(clienteId), CancellationToken.None);

        // Assert
        Assert.Empty(result);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-CT-BYCLIENT-03: Maps all ContactoDto fields correctly including DateTimeOffset
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task HandleAsync_WithContacto_MapsAllDtoFieldsIncludingDateTimeOffset()
    {
        // Arrange
        var clienteId = Guid.NewGuid();
        var contacto = ContactoEntity.Create("Test Mapeo", "Cargo Test", "+57 310 000 0001", "test@mapeo.co", clienteId);
        var repository = new FakeContactoRepository(new List<ContactoEntity> { contacto });
        var handler = new GetContactosByClienteIdQueryHandler(repository);

        // Act
        var result = (await handler.HandleAsync(new GetContactosByClienteIdQuery(clienteId), CancellationToken.None)).ToList();

        // Assert — all fields mapped
        Assert.Single(result);
        var dto = result[0];
        Assert.NotEqual(Guid.Empty, dto.Id);
        Assert.Equal("Test Mapeo", dto.Nombre);
        Assert.Equal("Cargo Test", dto.Cargo);
        Assert.Equal("+57 310 000 0001", dto.Telefono);
        Assert.Equal("test@mapeo.co", dto.Email);
        Assert.Equal(clienteId, dto.ClienteId);
        // DateTimeOffset must have a meaningful Offset property (non-default struct)
        Assert.IsType<DateTimeOffset>(dto.CreatedAt);
        Assert.IsType<DateTimeOffset>(dto.UpdatedAt);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-CT-BYCLIENT-04: Propagates repository exceptions to the caller
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task HandleAsync_WhenRepositoryThrows_PropagatesException()
    {
        // Arrange
        var clienteId = Guid.NewGuid();
        var repository = new ThrowingContactoRepository(new InvalidOperationException("DB error"));
        var handler = new GetContactosByClienteIdQueryHandler(repository);

        // Act / Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => handler.HandleAsync(new GetContactosByClienteIdQuery(clienteId), CancellationToken.None));
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
