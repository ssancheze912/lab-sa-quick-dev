using SiesaAgents.Application.Contactos.Queries;
using SiesaAgents.Domain.Contactos.Entities;
using SiesaAgents.Domain.Contactos.Interfaces;

namespace SiesaAgents.UnitTests.Handlers;

/// <summary>
/// ATDD — Story 4.5: Orphan Contacts Filter
/// Backend Unit Tests — RED Phase
///
/// Tests are intentionally failing until GetOrphanContactosQueryHandler is implemented.
///
/// Coverage:
///   UNIT-B-AC-ORPHAN-01  P1  — Handler returns ContactoDto[] where all have ClienteId == null (AC1)
///   UNIT-B-AC-ORPHAN-02  P1  — Handler returns empty array when repository has no orphan contacts (AC2)
/// </summary>
public class GetOrphanContactosQueryHandlerTests
{
    // UNIT-B-AC-ORPHAN-01:
    // Given the repository returns contacts where ClienteId == null
    // When GetOrphanContactosQueryHandler.HandleAsync is called
    // Then only contacts with ClienteId == null are returned as ContactoDto[]
    [Fact]
    public async Task HandleAsync_WithOrphanContactos_ReturnsOnlyOrphanDtos()
    {
        // Arrange
        var clienteId = Guid.NewGuid();

        var orphanContacto1 = ContactoEntity.Create(
            "Huerfano Uno", "Gerente", "+57 1 111 1111", "huerfano1@empresa.com", clienteId: null);
        var orphanContacto2 = ContactoEntity.Create(
            "Huerfano Dos", "Analista", "+57 1 222 2222", "huerfano2@empresa.com", clienteId: null);
        var contactoWithClient = ContactoEntity.Create(
            "Con Cliente Tres", "Director", "+57 1 333 3333", "concliente3@empresa.com", clienteId: clienteId);

        // The fake repository's GetOrphanAsync returns only orphan contacts (as the real implementation would)
        var orphanContacts = new List<ContactoEntity> { orphanContacto1, orphanContacto2 };
        var repository = new FakeContactoRepositoryWithOrphans(orphanContacts);
        var handler = new GetOrphanContactosQueryHandler(repository);

        // Act
        var result = (await handler.HandleAsync(new GetOrphanContactosQuery(), CancellationToken.None)).ToList();

        // Assert — returns exactly 2 orphan contacts
        Assert.Equal(2, result.Count);

        // AND — all returned dtos have ClienteId == null
        Assert.All(result, dto => Assert.Null(dto.ClienteId));

        // AND — the correct contacts are returned
        Assert.Contains(result, d => d.Nombre == "Huerfano Uno" && d.Email == "huerfano1@empresa.com");
        Assert.Contains(result, d => d.Nombre == "Huerfano Dos" && d.Email == "huerfano2@empresa.com");

        // AND — the contact with a clienteId is NOT in the result
        Assert.DoesNotContain(result, d => d.Nombre == "Con Cliente Tres");
    }

    // UNIT-B-AC-ORPHAN-02:
    // Given the repository has no orphan contacts (all contacts have a clienteId)
    // When GetOrphanContactosQueryHandler.HandleAsync is called
    // Then an empty collection is returned
    [Fact]
    public async Task HandleAsync_WithNoOrphanContactos_ReturnsEmptyCollection()
    {
        // Arrange — repository returns empty enumerable for GetOrphanAsync
        var repository = new FakeContactoRepositoryWithOrphans(new List<ContactoEntity>());
        var handler = new GetOrphanContactosQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetOrphanContactosQuery(), CancellationToken.None);

        // Assert — result is empty (no error thrown)
        Assert.Empty(result);
    }

    // ---------------------------------------------------------------------------
    // Fake repository — simulates IContactoRepository with GetOrphanAsync support
    // ---------------------------------------------------------------------------
    private sealed class FakeContactoRepositoryWithOrphans : IContactoRepository
    {
        private readonly IEnumerable<ContactoEntity> _orphanData;

        public FakeContactoRepositoryWithOrphans(IEnumerable<ContactoEntity> orphanData)
        {
            _orphanData = orphanData;
        }

        // GetOrphanAsync returns only the pre-set orphan data
        public Task<IEnumerable<ContactoEntity>> GetOrphanAsync(CancellationToken ct)
            => Task.FromResult(_orphanData);

        public Task<IEnumerable<ContactoEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult(_orphanData);

        public Task<ContactoEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromResult(_orphanData.FirstOrDefault(c => c.Id == id));

        public Task<IEnumerable<ContactoEntity>> GetByClienteIdAsync(Guid clienteId, CancellationToken ct)
            => Task.FromResult(_orphanData.Where(c => c.ClienteId == clienteId));

        public Task<ContactoEntity> CreateAsync(ContactoEntity entity, CancellationToken ct)
            => Task.FromResult(entity);

        public Task<ContactoEntity> UpdateAsync(ContactoEntity entity, CancellationToken ct)
            => Task.FromResult(entity);

        public Task DeleteAsync(ContactoEntity entity, CancellationToken ct)
            => Task.CompletedTask;
    }
}
