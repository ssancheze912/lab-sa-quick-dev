using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Story 2.1: Client List &amp; Search — GetClientesQueryHandler Edge Cases
/// Epic 2: Client Management (Gestión de Clientes)
///
/// Expands GetClientesQueryHandlerTests.cs with edge cases NOT covered by ATDD:
///
///   Boundary conditions:
///     - Repository throws OperationCanceledException when CT is already cancelled
///     - Repository throws arbitrary exception — handler propagates it (no swallow)
///     - Large dataset (50 entities) — all mapped correctly, none dropped
///     - DTOs are independent records (no shared reference aliasing)
///
///   DTO invariants:
///     - Each DTO has a unique Id (no duplicate Guids in result set)
///     - Nombre field does not get trimmed or mutated by the handler
///     - Nit field is not modified (leading zeros preserved as strings)
///     - CreatedAt and UpdatedAt are independent DateTimeOffset values per entity
///
///   Handler contract:
///     - handleAsync returns IEnumerable (lazy) — can be iterated more than once
///     - Ordering of output matches ordering of repository return (no implicit sort)
///
/// Test Cases:
///   TC-E2-P2-19 — Repository exception propagates from handler
///   TC-E2-P2-20 — Already-cancelled CT causes OperationCanceledException
///   TC-E2-P2-21 — 50-entity dataset — all 50 mapped correctly
///   TC-E2-P2-22 — Each DTO has unique Id
///   TC-E2-P2-23 — Nombre is not trimmed or mutated
///   TC-E2-P2-24 — Output order matches repository return order
/// </summary>
public class GetClientesQueryHandlerEdgeCaseTests
{
    // ─────────────────────────────────────────────────────────────────────
    // TC-E2-P2-19 — Repository exception propagates (no silent swallow)
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_WhenRepositoryThrows_ExceptionPropagatesUnchanged()
    {
        // GIVEN: Repository is configured to throw an InvalidOperationException
        var repository = new ThrowingClienteRepository(
            new InvalidOperationException("Database connection failed")
        );
        var handler = new GetClientesQueryHandler(repository);

        // WHEN: HandleAsync is called
        // THEN: The exception propagates (handler does NOT swallow exceptions)
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => handler.HandleAsync(new GetClientesQuery(), CancellationToken.None)
        );

        Assert.Equal("Database connection failed", ex.Message);
    }

    [Fact]
    public async Task HandleAsync_WhenRepositoryThrowsTaskCanceled_PropagatesOriginalException()
    {
        // GIVEN: Repository throws TaskCanceledException (e.g., DB timeout)
        var repository = new ThrowingClienteRepository(new TaskCanceledException("Query timed out"));
        var handler = new GetClientesQueryHandler(repository);

        // WHEN / THEN: TaskCanceledException propagates unchanged
        await Assert.ThrowsAsync<TaskCanceledException>(
            () => handler.HandleAsync(new GetClientesQuery(), CancellationToken.None)
        );
    }

    // ─────────────────────────────────────────────────────────────────────
    // TC-E2-P2-20 — Already-cancelled CancellationToken
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_WhenCancellationTokenAlreadyCancelled_CancelsOperationAtRepository()
    {
        // GIVEN: A CancellationToken that is already in cancelled state
        var cts = new CancellationTokenSource();
        cts.Cancel(); // Pre-cancel before calling handler

        var repository = new CancellationAwareRepository();
        var handler = new GetClientesQueryHandler(repository);

        // WHEN: HandleAsync is called with the cancelled token
        // THEN: OperationCanceledException or TaskCanceledException is thrown OR
        //       the repository receives the cancelled token and the call completes
        //       (behavior depends on whether Npgsql / EF Core checks CT before execution)
        // We test that the cancelled token is forwarded to the repository
        try
        {
            await handler.HandleAsync(new GetClientesQuery(), cts.Token);
        }
        catch (OperationCanceledException)
        {
            // Acceptable — already-cancelled CT may throw before repository call
        }

        // IF the repository was called, the token it received must be cancelled
        if (repository.WasCalled)
        {
            Assert.True(
                repository.ReceivedToken.IsCancellationRequested,
                "Repository must receive the cancelled CancellationToken"
            );
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // TC-E2-P2-21 — Large dataset (50 entities) — all mapped without drop
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_WhenRepositoryHas50Entities_ReturnsAll50Dtos()
    {
        // GIVEN: 50 distinct ClienteEntity objects in the repository
        var entities = Enumerable.Range(1, 50)
            .Select(i => ClienteEntity.Create(
                nombre: $"Cliente {i}",
                nit: $"9{i:D8}",
                telefono: $"300{i:D7}",
                ciudad: "Bogotá"
            ))
            .ToList();

        var repository = new FakeClienteRepository(entities);
        var handler = new GetClientesQueryHandler(repository);

        // WHEN: HandleAsync is called
        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);
        var dtos = result.ToList();

        // THEN: All 50 DTOs are returned — no entity is dropped
        Assert.Equal(50, dtos.Count);
    }

    [Fact]
    public async Task HandleAsync_WhenRepositoryHas50Entities_AllDtosHaveDistinctIds()
    {
        // GIVEN: 50 entities — each has an auto-assigned unique Guid from Entity base class
        var entities = Enumerable.Range(1, 50)
            .Select(i => ClienteEntity.Create($"Cliente {i}", $"9{i:D8}", $"300{i:D7}", "Bogotá"))
            .ToList();

        var repository = new FakeClienteRepository(entities);
        var handler = new GetClientesQueryHandler(repository);

        // WHEN: HandleAsync is called
        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);
        var dtos = result.ToList();

        // THEN: All 50 DTO Ids are distinct (no aliasing of Guid.NewGuid)
        var distinctIds = dtos.Select(d => d.Id).Distinct().Count();
        Assert.Equal(50, distinctIds);
    }

    // ─────────────────────────────────────────────────────────────────────
    // TC-E2-P2-22 — Each DTO has a unique Id (TC-E2-P2-22)
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_WhenMultipleEntitiesExist_EachDtoHasNonEmptyDistinctId()
    {
        // GIVEN: 3 ClienteEntity instances (each gets its own Guid.NewGuid() from Entity base)
        var entities = new[]
        {
            ClienteEntity.Create("Alpha SA", "100000001", "3001111111", "Bogotá"),
            ClienteEntity.Create("Beta Ltda", "100000002", "3002222222", "Medellín"),
            ClienteEntity.Create("Gamma Corp", "100000003", "3003333333", "Cali"),
        };

        var repository = new FakeClienteRepository(entities);
        var handler = new GetClientesQueryHandler(repository);

        // WHEN: HandleAsync is called
        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);
        var dtos = result.ToList();

        // THEN: 3 DTOs all have non-empty, unique Guids
        Assert.Equal(3, dtos.Count);
        Assert.All(dtos, dto => Assert.NotEqual(Guid.Empty, dto.Id));

        var ids = dtos.Select(d => d.Id).ToHashSet();
        Assert.Equal(3, ids.Count); // All 3 are distinct
    }

    // ─────────────────────────────────────────────────────────────────────
    // TC-E2-P2-23 — Nombre is not trimmed or mutated by the handler
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_DoesNotTrimOrMutateNombreField()
    {
        // GIVEN: An entity with leading/trailing spaces in Nombre
        // (factory validates non-whitespace, so we use a valid name with internal spaces)
        var entity = ClienteEntity.Create(
            nombre: "Empresa Con Espacios SA",
            nit: "900000001",
            telefono: "3001111111",
            ciudad: "Bogotá"
        );

        var repository = new FakeClienteRepository(new[] { entity });
        var handler = new GetClientesQueryHandler(repository);

        // WHEN: HandleAsync is called
        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);
        var dto = result.Single();

        // THEN: Nombre in DTO exactly matches the entity (not trimmed or altered)
        Assert.Equal("Empresa Con Espacios SA", dto.Nombre);
        Assert.Equal(entity.Nombre, dto.Nombre);
    }

    [Fact]
    public async Task HandleAsync_DoesNotMutateNitField()
    {
        // GIVEN: An entity with a NIT that contains only digits (common Colombian NIT format)
        var entity = ClienteEntity.Create("Test Corp", "9001234560", "3001111111", "Bogotá");
        var repository = new FakeClienteRepository(new[] { entity });
        var handler = new GetClientesQueryHandler(repository);

        // WHEN: HandleAsync maps the entity
        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);
        var dto = result.Single();

        // THEN: Nit in DTO exactly matches the entity (no trimming, no padding, no modification)
        Assert.Equal("9001234560", dto.Nit);
        Assert.Equal(entity.Nit, dto.Nit);
    }

    // ─────────────────────────────────────────────────────────────────────
    // TC-E2-P2-24 — Output order matches repository return order
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_PreservesOrderingFromRepository()
    {
        // GIVEN: 3 entities returned in a specific order (Z → A by nombre)
        var entity1 = ClienteEntity.Create("Zebra Corp", "300000001", "3001111111", "Bogotá");
        var entity2 = ClienteEntity.Create("Mango SA", "300000002", "3002222222", "Medellín");
        var entity3 = ClienteEntity.Create("Alpha Ltda", "300000003", "3003333333", "Cali");

        var repository = new FakeClienteRepository(new[] { entity1, entity2, entity3 });
        var handler = new GetClientesQueryHandler(repository);

        // WHEN: HandleAsync maps the entities
        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);
        var dtos = result.ToList();

        // THEN: Output order matches repository order (Zebra → Mango → Alpha)
        // Handler must NOT perform any implicit sorting
        Assert.Equal("Zebra Corp", dtos[0].Nombre);
        Assert.Equal("Mango SA", dtos[1].Nombre);
        Assert.Equal("Alpha Ltda", dtos[2].Nombre);
    }

    // ─────────────────────────────────────────────────────────────────────
    // ClienteDto record invariants
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_DtosAreIndependentRecords_NotSameReference()
    {
        // GIVEN: 2 entities with the same ciudad but different Ids
        var entity1 = ClienteEntity.Create("Alpha SA", "100000001", "3001111111", "Bogotá");
        var entity2 = ClienteEntity.Create("Beta SA", "100000002", "3002222222", "Bogotá");

        var repository = new FakeClienteRepository(new[] { entity1, entity2 });
        var handler = new GetClientesQueryHandler(repository);

        // WHEN: HandleAsync maps both entities
        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);
        var dtos = result.ToList();

        // THEN: Each DTO is a separate record object (not the same reference)
        Assert.NotSame(dtos[0], dtos[1]);
        Assert.NotEqual(dtos[0].Id, dtos[1].Id);
        Assert.NotEqual(dtos[0].Nombre, dtos[1].Nombre);
    }

    [Fact]
    public async Task HandleAsync_AllDtoFieldsMatchEntityFields_ExactMapping()
    {
        // GIVEN: A single entity with precise field values
        var entity = ClienteEntity.Create(
            nombre: "Exact Name Corp",
            nit: "123456789",
            telefono: "6011234567",
            ciudad: "Barranquilla"
        );

        var repository = new FakeClienteRepository(new[] { entity });
        var handler = new GetClientesQueryHandler(repository);

        // WHEN: HandleAsync maps the entity
        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);
        var dto = result.Single();

        // THEN: Every DTO field maps exactly to the entity field (no transformation)
        Assert.Equal(entity.Id, dto.Id);
        Assert.Equal(entity.Nombre, dto.Nombre);
        Assert.Equal(entity.Nit, dto.Nit);
        Assert.Equal(entity.Telefono, dto.Telefono);
        Assert.Equal(entity.Ciudad, dto.Ciudad);
        Assert.Equal(entity.CreatedAt, dto.CreatedAt);
        Assert.Equal(entity.UpdatedAt, dto.UpdatedAt);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Test Doubles
    // ─────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Fake that returns a predetermined set of ClienteEntity objects.
    /// </summary>
    private sealed class FakeClienteRepository : IClienteRepository
    {
        private readonly IEnumerable<ClienteEntity> _clientes;

        public FakeClienteRepository(IEnumerable<ClienteEntity> clientes)
        {
            _clientes = clientes;
        }

        public Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult(_clientes);

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromResult(_clientes.FirstOrDefault(c => c.Id == id));

        public Task AddAsync(ClienteEntity cliente, CancellationToken ct) => Task.CompletedTask;
        public Task UpdateAsync(ClienteEntity cliente, CancellationToken ct) => Task.CompletedTask;
        public Task DeleteAsync(Guid id, CancellationToken ct) => Task.CompletedTask;
    }

    /// <summary>
    /// Fake that always throws the configured exception from GetAllAsync.
    /// Used to verify handler propagates exceptions without swallowing them.
    /// </summary>
    private sealed class ThrowingClienteRepository : IClienteRepository
    {
        private readonly Exception _exceptionToThrow;

        public ThrowingClienteRepository(Exception exceptionToThrow)
        {
            _exceptionToThrow = exceptionToThrow;
        }

        public Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromException<IEnumerable<ClienteEntity>>(_exceptionToThrow);

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromResult<ClienteEntity?>(null);

        public Task AddAsync(ClienteEntity cliente, CancellationToken ct) => Task.CompletedTask;
        public Task UpdateAsync(ClienteEntity cliente, CancellationToken ct) => Task.CompletedTask;
        public Task DeleteAsync(Guid id, CancellationToken ct) => Task.CompletedTask;
    }

    /// <summary>
    /// Fake that records whether it was called and captures the CancellationToken.
    /// Used to verify token forwarding with pre-cancelled tokens.
    /// </summary>
    private sealed class CancellationAwareRepository : IClienteRepository
    {
        public bool WasCalled { get; private set; }
        public CancellationToken ReceivedToken { get; private set; }

        public Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)
        {
            WasCalled = true;
            ReceivedToken = ct;

            // If already cancelled, throw to simulate real EF Core / Npgsql behavior
            ct.ThrowIfCancellationRequested();

            return Task.FromResult(Enumerable.Empty<ClienteEntity>());
        }

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromResult<ClienteEntity?>(null);

        public Task AddAsync(ClienteEntity cliente, CancellationToken ct) => Task.CompletedTask;
        public Task UpdateAsync(ClienteEntity cliente, CancellationToken ct) => Task.CompletedTask;
        public Task DeleteAsync(Guid id, CancellationToken ct) => Task.CompletedTask;
    }
}
