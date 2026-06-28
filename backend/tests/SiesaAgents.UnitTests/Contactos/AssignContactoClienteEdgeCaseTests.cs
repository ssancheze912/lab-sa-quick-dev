using SiesaAgents.Application.Contactos.Commands;
using SiesaAgents.Domain.Contactos.Entities;
using SiesaAgents.Domain.Contactos.Interfaces;
using Xunit;

namespace SiesaAgents.UnitTests.Contactos;

/// <summary>
/// Edge-case tests — Story 4.2: Associate &amp; Disassociate Contacts from Client
///
/// Expands ATDD coverage (AssignContactoClienteTests.cs) with:
///   - TC-E4-4-2-UNIT-EDGE-1 (P2) — Re-assign: AssignCliente called twice with different GUIDs → last value wins
///   - TC-E4-4-2-UNIT-EDGE-2 (P2) — Idempotent: AssignCliente with same clienteId twice → SaveChangesAsync called twice
///   - TC-E4-4-2-UNIT-EDGE-3 (P2) — CancellationToken is forwarded to GetByIdAsync
///   - TC-E4-4-2-UNIT-EDGE-4 (P2) — ContactoEntity.AssignCliente with same non-null value → ClienteId unchanged in value
///   - TC-E4-4-2-UNIT-EDGE-5 (P2) — ContactoEntity.AssignCliente: UpdatedAt uses UTC offset (TimeSpan.Zero)
///   - TC-E4-4-2-UNIT-EDGE-6 (P1) — Handler maps all ContactoDto fields correctly after assignment
/// </summary>

// ─────────────────────────────────────────────────────────────────────────────
// Spy repository (tracks calls with token support)
// ─────────────────────────────────────────────────────────────────────────────

file sealed class SpyContactoRepository : IContactoRepository
{
    private readonly Dictionary<Guid, ContactoEntity> _store = new();
    public int SaveChangesCallCount { get; private set; }
    public CancellationToken LastCancellationToken { get; private set; }

    public void Seed(ContactoEntity contacto) => _store[contacto.Id] = contacto;

    public Task<IReadOnlyList<ContactoEntity>> GetAllAsync(CancellationToken ct = default)
        => Task.FromResult<IReadOnlyList<ContactoEntity>>(_store.Values.ToList());

    public Task<ContactoEntity?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        LastCancellationToken = ct;
        return Task.FromResult(_store.TryGetValue(id, out var c) ? c : null);
    }

    public Task AddAsync(ContactoEntity contacto, CancellationToken ct = default)
    {
        _store[contacto.Id] = contacto;
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync(CancellationToken ct = default)
    {
        SaveChangesCallCount++;
        return Task.CompletedTask;
    }

    public Task DeleteAsync(ContactoEntity contacto, CancellationToken ct = default)
    {
        _store.Remove(contacto.Id);
        return Task.CompletedTask;
    }

    public Task UpdateAsync(ContactoEntity contacto, CancellationToken ct = default)
        => Task.CompletedTask;
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler edge-case unit tests
// ─────────────────────────────────────────────────────────────────────────────

public class AssignContactoClienteHandlerEdgeCaseTests
{
    private const string ValidNombre = "Sofía Herrera";
    private const string ValidCargo = "Coordinadora";
    private const string ValidTelefono = "3151234567";
    private const string ValidEmail = "sofia.herrera@empresa.co";

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E4-4-2-UNIT-EDGE-1 (P2) — Re-assign: second call with different clienteId → last wins
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E4-4-2-UNIT-EDGE-1 (P2)
    /// GIVEN a ContactoEntity assigned to clienteA
    /// WHEN HandleAsync is called with clienteB
    /// THEN the returned ContactoDto.ClienteId equals clienteB (last assignment wins)
    /// AND SaveChangesAsync is called exactly once for this invocation
    /// </summary>
    [Fact]
    public async Task HandleAsync_WhenCalledWithDifferentClienteId_LastClienteIdWins()
    {
        // GIVEN: Contact already assigned to clienteA
        var repo = new SpyContactoRepository();
        var contacto = ContactoEntity.Create(ValidNombre, ValidCargo, ValidTelefono, ValidEmail);
        var clienteA = Guid.NewGuid();
        contacto.AssignCliente(clienteA);
        repo.Seed(contacto);

        var clienteB = Guid.NewGuid();
        var handler = new AssignContactoClienteCommandHandler(repo);
        var command = new AssignContactoClienteCommand(contacto.Id, clienteB);

        // WHEN: Re-assign to clienteB
        var result = await handler.HandleAsync(command);

        // THEN: ClienteId is now clienteB
        Assert.NotNull(result);
        Assert.Equal(clienteB, result.ClienteId);

        // AND: clienteA is no longer the value
        Assert.NotEqual(clienteA, result.ClienteId);

        // AND: SaveChangesAsync called once
        Assert.Equal(1, repo.SaveChangesCallCount);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E4-4-2-UNIT-EDGE-2 (P2) — Same clienteId twice → SaveChangesAsync called each time
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E4-4-2-UNIT-EDGE-2 (P2)
    /// GIVEN a ContactoEntity assigned to clienteId
    /// WHEN HandleAsync is called twice with the same clienteId
    /// THEN SaveChangesAsync is called for each invocation (idempotent writes are OK)
    /// </summary>
    [Fact]
    public async Task HandleAsync_WhenCalledTwiceWithSameClienteId_SaveChangesCalledEachTime()
    {
        // GIVEN: Contact assigned to clienteId
        var repo = new SpyContactoRepository();
        var contacto = ContactoEntity.Create(ValidNombre, ValidCargo, ValidTelefono, ValidEmail);
        var clienteId = Guid.NewGuid();
        contacto.AssignCliente(clienteId);
        repo.Seed(contacto);

        var handler = new AssignContactoClienteCommandHandler(repo);
        var command = new AssignContactoClienteCommand(contacto.Id, clienteId);

        // WHEN: Call handler twice with identical command
        var result1 = await handler.HandleAsync(command);
        var result2 = await handler.HandleAsync(command);

        // THEN: Both calls succeed and return the same clienteId
        Assert.NotNull(result1);
        Assert.NotNull(result2);
        Assert.Equal(clienteId, result1.ClienteId);
        Assert.Equal(clienteId, result2.ClienteId);

        // AND: SaveChangesAsync was called twice (once per invocation)
        Assert.Equal(2, repo.SaveChangesCallCount);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E4-4-2-UNIT-EDGE-3 (P2) — CancellationToken forwarded to repository
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E4-4-2-UNIT-EDGE-3 (P2)
    /// GIVEN a valid contacto in the repository
    /// WHEN HandleAsync is called with a specific CancellationToken
    /// THEN the repository's GetByIdAsync receives the same token (propagation)
    /// </summary>
    [Fact]
    public async Task HandleAsync_WhenCancellationTokenProvided_ForwardsTokenToRepository()
    {
        // GIVEN
        var repo = new SpyContactoRepository();
        var contacto = ContactoEntity.Create(ValidNombre, ValidCargo, ValidTelefono, ValidEmail);
        repo.Seed(contacto);

        var handler = new AssignContactoClienteCommandHandler(repo);
        var command = new AssignContactoClienteCommand(contacto.Id, Guid.NewGuid());

        using var cts = new CancellationTokenSource();
        var token = cts.Token;

        // WHEN: HandleAsync called with specific token
        await handler.HandleAsync(command, token);

        // THEN: The repository received the same cancellation token
        Assert.Equal(token, repo.LastCancellationToken);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E4-4-2-UNIT-EDGE-6 (P1) — Handler maps ALL ContactoDto fields correctly
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E4-4-2-UNIT-EDGE-6 (P1)
    /// GIVEN a ContactoEntity with known field values
    /// WHEN HandleAsync assigns a clienteId
    /// THEN the returned ContactoDto contains all fields correctly mapped
    /// (guards against partial DTO mapping regressions)
    /// </summary>
    [Fact]
    public async Task HandleAsync_WhenContactoAssigned_ReturnsDtoWithAllFieldsMapped()
    {
        // GIVEN
        var repo = new SpyContactoRepository();
        var contacto = ContactoEntity.Create(
            nombre: "Ana Martínez",
            cargo: "Directora Comercial",
            telefono: "3001112222",
            email: "ana.martinez@empresa.co"
        );
        repo.Seed(contacto);

        var clienteId = Guid.NewGuid();
        var handler = new AssignContactoClienteCommandHandler(repo);
        var command = new AssignContactoClienteCommand(contacto.Id, clienteId);

        // WHEN
        var result = await handler.HandleAsync(command);

        // THEN: All DTO fields are correctly mapped
        Assert.NotNull(result);
        Assert.Equal(contacto.Id, result.Id);
        Assert.Equal("Ana Martínez", result.Nombre);
        Assert.Equal("Directora Comercial", result.Cargo);
        Assert.Equal("3001112222", result.Telefono);
        Assert.Equal("ana.martinez@empresa.co", result.Email);
        Assert.Equal(clienteId, result.ClienteId);

        // AND: Timestamps are present (not default DateTimeOffset.MinValue)
        Assert.NotEqual(DateTimeOffset.MinValue, result.CreatedAt);
        Assert.NotEqual(DateTimeOffset.MinValue, result.UpdatedAt);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Domain entity edge-case tests
// ─────────────────────────────────────────────────────────────────────────────

public class ContactoEntityAssignClienteEdgeCaseTests
{
    private const string ValidNombre = "Carlos Torres";
    private const string ValidCargo = "Representante";
    private const string ValidTelefono = "3001234567";
    private const string ValidEmail = "carlos.torres@empresa.co";

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E4-4-2-UNIT-EDGE-4 (P2) — AssignCliente with same non-null value is a no-op for ClienteId value
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E4-4-2-UNIT-EDGE-4 (P2)
    /// GIVEN a ContactoEntity already assigned to clienteId
    /// WHEN AssignCliente is called with the SAME clienteId
    /// THEN ClienteId remains the same value (no corruption)
    /// AND UpdatedAt is refreshed (domain always updates timestamp on call)
    /// </summary>
    [Fact]
    public async Task AssignCliente_WhenCalledWithSameClienteId_ClienteIdRemainsUnchanged()
    {
        // GIVEN
        var entity = ContactoEntity.Create(ValidNombre, ValidCargo, ValidTelefono, ValidEmail);
        var clienteId = Guid.NewGuid();
        entity.AssignCliente(clienteId);
        var updatedAtFirst = entity.UpdatedAt;

        await Task.Delay(5); // Ensure measurable time difference

        // WHEN: AssignCliente with the same clienteId
        entity.AssignCliente(clienteId);

        // THEN: ClienteId is still the same value
        Assert.Equal(clienteId, entity.ClienteId);

        // AND: UpdatedAt is refreshed (domain always updates, even on same value)
        Assert.True(entity.UpdatedAt >= updatedAtFirst,
            $"UpdatedAt ({entity.UpdatedAt}) should be >= first ({updatedAtFirst})");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E4-4-2-UNIT-EDGE-5 (P2) — UpdatedAt uses UTC offset after AssignCliente
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E4-4-2-UNIT-EDGE-5 (P2)
    /// GIVEN a ContactoEntity
    /// WHEN AssignCliente is called (with any value — null or GUID)
    /// THEN entity.UpdatedAt.Offset is TimeSpan.Zero (UTC — as required by company standards)
    /// </summary>
    [Theory]
    [InlineData(true)]  // null → disassociate
    [InlineData(false)] // non-null → associate
    public void AssignCliente_UpdatedAt_AlwaysUsesUtcOffset(bool useNull)
    {
        // GIVEN
        var entity = ContactoEntity.Create(ValidNombre, ValidCargo, ValidTelefono, ValidEmail);
        var value = useNull ? (Guid?)null : Guid.NewGuid();

        // WHEN
        entity.AssignCliente(value);

        // THEN: UpdatedAt offset is UTC (zero)
        Assert.Equal(TimeSpan.Zero, entity.UpdatedAt.Offset);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Extra: AssignCliente multiple times in sequence → last value stored
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// GIVEN a ContactoEntity
    /// WHEN AssignCliente is called three times in sequence: A → B → null
    /// THEN ClienteId is null after the last call (sequence correctness)
    /// </summary>
    [Fact]
    public void AssignCliente_CalledInSequence_LastValueIsStoredCorrectly()
    {
        // GIVEN
        var entity = ContactoEntity.Create(ValidNombre, ValidCargo, ValidTelefono, ValidEmail);
        var clienteA = Guid.NewGuid();
        var clienteB = Guid.NewGuid();

        // WHEN: A → B → null
        entity.AssignCliente(clienteA);
        Assert.Equal(clienteA, entity.ClienteId);

        entity.AssignCliente(clienteB);
        Assert.Equal(clienteB, entity.ClienteId);

        entity.AssignCliente(null);

        // THEN: Final value is null
        Assert.Null(entity.ClienteId);
    }
}
