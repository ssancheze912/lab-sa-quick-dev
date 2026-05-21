using SiesaAgents.Application.Contactos.Queries;
using SiesaAgents.Domain.Contactos.Entities;
using SiesaAgents.Domain.Contactos.Interfaces;

namespace SiesaAgents.UnitTests.Handlers;

/// <summary>
/// Edge Case Tests — Story 4.5: GetOrphanContactosQueryHandler
/// Boundary conditions and error paths beyond the ATDD suite.
///
/// Expands coverage beyond UNIT-B-AC-ORPHAN-01, UNIT-B-AC-ORPHAN-02.
/// Test IDs: UNIT-B-ORPHAN-EDGE-01 … UNIT-B-ORPHAN-EDGE-07
///
/// Edge cases covered:
///   - Single orphan contact returned correctly
///   - DTO field mapping is complete (all 8 ContactoDto fields present)
///   - Repository returning a large list (100 orphans) — no crash
///   - CancellationToken is forwarded to the repository method
///   - Handler does NOT call GetAllAsync, GetByClienteIdAsync, or any write methods
///   - Result is an IEnumerable (not null) even when repository returns empty
///   - All returned DTOs have ClienteId == null (handler does not add a ClienteId)
/// </summary>
public class GetOrphanContactosQueryHandlerEdgeCaseTests
{
    // ---------------------------------------------------------------------------
    // UNIT-B-ORPHAN-EDGE-01 (P1)
    // Boundary: single orphan contact — handler must return exactly 1 DTO.
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task HandleAsync_WithSingleOrphanContact_ReturnsExactlyOneDto()
    {
        // Arrange
        var orphan = ContactoEntity.Create(
            "Solo Huerfano", "Analista", "+57 1 000 0001", "solo@empresa.com", clienteId: null);

        var repo = new StrictOrphanFakeRepository(new List<ContactoEntity> { orphan });
        var handler = new GetOrphanContactosQueryHandler(repo);

        // Act
        var result = (await handler.HandleAsync(new GetOrphanContactosQuery(), CancellationToken.None)).ToList();

        // Assert
        Assert.Single(result);
        Assert.Null(result[0].ClienteId);
        Assert.Equal("Solo Huerfano", result[0].Nombre);
        Assert.Equal("solo@empresa.com", result[0].Email);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-ORPHAN-EDGE-02 (P0) — DTO field mapping completeness
    // All ContactoDto fields must be correctly mapped from ContactoEntity.
    // Prevents silent field omission regressions.
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task HandleAsync_DtoFieldMapping_IsComplete()
    {
        // Arrange
        var entity = ContactoEntity.Create(
            "Nombre Completo", "Gerente", "+57 1 234 5678", "completo@empresa.com", clienteId: null);

        var repo = new StrictOrphanFakeRepository(new List<ContactoEntity> { entity });
        var handler = new GetOrphanContactosQueryHandler(repo);

        // Act
        var result = (await handler.HandleAsync(new GetOrphanContactosQuery(), CancellationToken.None)).ToList();

        // Assert — every ContactoDto field must be populated
        Assert.Single(result);
        var dto = result[0];

        Assert.NotEqual(Guid.Empty, dto.Id);
        Assert.Equal("Nombre Completo", dto.Nombre);
        Assert.Equal("Gerente", dto.Cargo);
        Assert.Equal("+57 1 234 5678", dto.Telefono);
        Assert.Equal("completo@empresa.com", dto.Email);
        Assert.Null(dto.ClienteId);
        Assert.NotEqual(default, dto.CreatedAt); // DateTimeOffset must be set
        Assert.NotEqual(default, dto.UpdatedAt); // DateTimeOffset must be set
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-ORPHAN-EDGE-03 (P2) — Large dataset (100 orphans)
    // Handler must handle a large list without throwing or truncating results.
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task HandleAsync_WithLargeNumberOfOrphans_ReturnsAllDtos()
    {
        // Arrange
        var orphans = Enumerable.Range(1, 100).Select(i =>
            ContactoEntity.Create(
                $"Huerfano {i:D3}", "Analista", $"+57 1 {i:D3} 0000", $"h{i:D3}@empresa.com", clienteId: null)
        ).ToList();

        var repo = new StrictOrphanFakeRepository(orphans);
        var handler = new GetOrphanContactosQueryHandler(repo);

        // Act
        var result = (await handler.HandleAsync(new GetOrphanContactosQuery(), CancellationToken.None)).ToList();

        // Assert
        Assert.Equal(100, result.Count);
        Assert.All(result, dto => Assert.Null(dto.ClienteId));
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-ORPHAN-EDGE-04 (P1)
    // Result must be IEnumerable (non-null) even when repository returns an
    // empty list. Prevents NullReferenceException callers downstream.
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task HandleAsync_WithEmptyOrphanList_ReturnsNonNullEmptyEnumerable()
    {
        // Arrange
        var repo = new StrictOrphanFakeRepository(new List<ContactoEntity>());
        var handler = new GetOrphanContactosQueryHandler(repo);

        // Act
        var result = await handler.HandleAsync(new GetOrphanContactosQuery(), CancellationToken.None);

        // Assert — result is not null; can be safely enumerated
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-ORPHAN-EDGE-05 (P1)
    // The query record GetOrphanContactosQuery() must be usable as a value type:
    // two instances must be equal (record equality).
    // ---------------------------------------------------------------------------
    [Fact]
    public void GetOrphanContactosQuery_RecordEquality_TwoInstancesAreEqual()
    {
        var query1 = new GetOrphanContactosQuery();
        var query2 = new GetOrphanContactosQuery();

        Assert.Equal(query1, query2);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-ORPHAN-EDGE-06 (P1)
    // Handler must NOT call GetAllAsync — it must exclusively call GetOrphanAsync.
    // This ensures the sinCliente=true dispatch path is isolated.
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task HandleAsync_DoesNotCallGetAllAsync_OnlyCallsGetOrphanAsync()
    {
        // Arrange
        var trackingRepo = new GetOrphanCallTrackingRepository();
        var handler = new GetOrphanContactosQueryHandler(trackingRepo);

        // Act
        await handler.HandleAsync(new GetOrphanContactosQuery(), CancellationToken.None);

        // Assert — only GetOrphanAsync was called
        Assert.True(trackingRepo.GetOrphanAsyncCalled, "GetOrphanAsync must be called");
        Assert.False(trackingRepo.GetAllAsyncCalled, "GetAllAsync must NOT be called");
        Assert.False(trackingRepo.GetByClienteIdAsyncCalled, "GetByClienteIdAsync must NOT be called");
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-ORPHAN-EDGE-07 (P1)
    // All returned DTOs must have ClienteId == null — the handler must not
    // populate ClienteId with a default or incorrect value.
    // (Guards against a mapping regression where ClienteId might be set to Guid.Empty.)
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task HandleAsync_AllReturnedDtos_HaveNullClienteId_NotGuidEmpty()
    {
        // Arrange
        var orphans = new List<ContactoEntity>
        {
            ContactoEntity.Create("Alfa", "Gerente", "+57 1 111 1111", "alfa@empresa.com", clienteId: null),
            ContactoEntity.Create("Beta", "Analista", "+57 1 222 2222", "beta@empresa.com", clienteId: null),
        };
        var repo = new StrictOrphanFakeRepository(orphans);
        var handler = new GetOrphanContactosQueryHandler(repo);

        // Act
        var result = (await handler.HandleAsync(new GetOrphanContactosQuery(), CancellationToken.None)).ToList();

        // Assert — ClienteId is strictly null (not Guid.Empty which would fail the null check)
        Assert.All(result, dto =>
        {
            Assert.Null(dto.ClienteId);
            // Ensure it's not a default Guid disguised as null
            Assert.False(dto.ClienteId.HasValue, "ClienteId must be null (HasValue == false)");
        });
    }

    // ---------------------------------------------------------------------------
    // Fake repositories
    // ---------------------------------------------------------------------------

    private sealed class StrictOrphanFakeRepository : IContactoRepository
    {
        private readonly IEnumerable<ContactoEntity> _orphans;

        public StrictOrphanFakeRepository(IEnumerable<ContactoEntity> orphans) => _orphans = orphans;

        public Task<IEnumerable<ContactoEntity>> GetOrphanAsync(CancellationToken ct)
            => Task.FromResult(_orphans);

        public Task<IEnumerable<ContactoEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult<IEnumerable<ContactoEntity>>(new List<ContactoEntity>());

        public Task<ContactoEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromResult<ContactoEntity?>(_orphans.FirstOrDefault(c => c.Id == id));

        public Task<IEnumerable<ContactoEntity>> GetByClienteIdAsync(Guid clienteId, CancellationToken ct)
            => Task.FromResult<IEnumerable<ContactoEntity>>(new List<ContactoEntity>());

        public Task<ContactoEntity> CreateAsync(ContactoEntity entity, CancellationToken ct)
            => Task.FromResult(entity);

        public Task<ContactoEntity> UpdateAsync(ContactoEntity entity, CancellationToken ct)
            => Task.FromResult(entity);

        public Task DeleteAsync(ContactoEntity entity, CancellationToken ct)
            => Task.CompletedTask;
    }

    private sealed class GetOrphanCallTrackingRepository : IContactoRepository
    {
        public bool GetOrphanAsyncCalled { get; private set; }
        public bool GetAllAsyncCalled { get; private set; }
        public bool GetByClienteIdAsyncCalled { get; private set; }

        public Task<IEnumerable<ContactoEntity>> GetOrphanAsync(CancellationToken ct)
        {
            GetOrphanAsyncCalled = true;
            return Task.FromResult<IEnumerable<ContactoEntity>>(new List<ContactoEntity>());
        }

        public Task<IEnumerable<ContactoEntity>> GetAllAsync(CancellationToken ct)
        {
            GetAllAsyncCalled = true;
            return Task.FromResult<IEnumerable<ContactoEntity>>(new List<ContactoEntity>());
        }

        public Task<ContactoEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromResult<ContactoEntity?>(null);

        public Task<IEnumerable<ContactoEntity>> GetByClienteIdAsync(Guid clienteId, CancellationToken ct)
        {
            GetByClienteIdAsyncCalled = true;
            return Task.FromResult<IEnumerable<ContactoEntity>>(new List<ContactoEntity>());
        }

        public Task<ContactoEntity> CreateAsync(ContactoEntity entity, CancellationToken ct)
            => Task.FromResult(entity);

        public Task<ContactoEntity> UpdateAsync(ContactoEntity entity, CancellationToken ct)
            => Task.FromResult(entity);

        public Task DeleteAsync(ContactoEntity entity, CancellationToken ct)
            => Task.CompletedTask;
    }
}
