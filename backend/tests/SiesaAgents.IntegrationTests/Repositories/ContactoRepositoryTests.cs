using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SiesaAgents.Domain.Entities;
using SiesaAgents.Infrastructure.Data;
using SiesaAgents.Infrastructure.Repositories;

namespace SiesaAgents.IntegrationTests.Repositories;

/// <summary>
/// Story 3.1 (AC #1, #2): verifies `ContactoRepository.GetAllAsync`'s dual-field
/// (Nombre OR Email) search filter and default ordering against a real
/// PostgreSQL connection (required for EF.Functions.ILike, no InMemory
/// equivalent). Also carries TC-E3-P0-02 — the cross-cutting regression gate
/// proving Epic 3's new repository/endpoint layer sits correctly on top of
/// the UNCHANGED `fk_contactos_clientes` FK (`ON DELETE SET NULL`) that
/// Story 2.5 already validated (R1). `ContactoEntity`/`ContactoConfiguration`/
/// the `contactos` table already exist (Story 2.5) — this story is purely
/// additive (repository + query + endpoint), never re-migrating the schema.
///
/// RED PHASE: `IContactoRepository`/`ContactoRepository` do not exist yet
/// (Story 3.1, Task 1). These tests define the expected read-only contract.
/// </summary>
public class ContactoRepositoryTests : IAsyncLifetime
{
    private const string ConnectionString =
        "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres";

    private AppDbContext _context = null!;
    private readonly List<Guid> _createdContactoIds = [];
    private readonly List<Guid> _createdClienteIds = [];

    public Task InitializeAsync()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(ConnectionString, npgsql => { })
            .ReplaceService<IHistoryRepository, SnakeCaseNpgsqlHistoryRepository>()
            .Options;
        _context = new AppDbContext(options);
        return Task.CompletedTask;
    }

    public async Task DisposeAsync()
    {
        if (_createdContactoIds.Count > 0)
        {
            await _context.Set<ContactoEntity>()
                .Where(c => _createdContactoIds.Contains(c.Id))
                .ExecuteDeleteAsync();
        }

        if (_createdClienteIds.Count > 0)
        {
            await _context.Clientes.Where(c => _createdClienteIds.Contains(c.Id)).ExecuteDeleteAsync();
        }

        await _context.DisposeAsync();
    }

    private async Task<ContactoEntity> SeedAsync(string nombre, string cargo, string telefono, string email, Guid? clienteId = null)
    {
        var contacto = ContactoEntity.Create(nombre, cargo, telefono, email, clienteId);
        _context.Set<ContactoEntity>().Add(contacto);
        await _context.SaveChangesAsync();
        _createdContactoIds.Add(contacto.Id);
        return contacto;
    }

    private async Task<ClienteEntity> SeedClienteAsync(string nombre, string nit)
    {
        var cliente = ClienteEntity.Create(nombre, nit, "3000000000", "Cali");
        _context.Clientes.Add(cliente);
        await _context.SaveChangesAsync();
        _createdClienteIds.Add(cliente.Id);
        return cliente;
    }

    // --- AC #1: GetAllAsync without search term returns all contacts -----------

    [Fact]
    public async Task GetAllAsync_WithoutSearchTerm_ReturnsAllContactos()
    {
        // GIVEN two seeded contacts
        var suffix = Guid.NewGuid().ToString("N")[..8];
        await SeedAsync($"Alpha Contacto {suffix}", "Analista", "3000000001", $"alpha.{suffix}@ejemplo.co");
        await SeedAsync($"Beta Contacto {suffix}", "Gerente", "3000000002", $"beta.{suffix}@ejemplo.co");
        var repository = new ContactoRepository(_context);

        // WHEN fetching all contacts with no search term
        var result = await repository.GetAllAsync(null, CancellationToken.None);

        // THEN both seeded contacts are present
        Assert.Contains(result, c => c.Nombre == $"Alpha Contacto {suffix}");
        Assert.Contains(result, c => c.Nombre == $"Beta Contacto {suffix}");
    }

    // --- AC #2 / R6: dual-field (Nombre OR Email) search, tested independently --

    [Fact]
    public async Task GetAllAsync_FiltersByNombreSubstring_CaseInsensitive()
    {
        // GIVEN contacts with distinct names
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var target = await SeedAsync($"Distribuidora Pacifico {suffix}", "Analista", "3000000001", $"target.{suffix}@ejemplo.co");
        await SeedAsync($"Suministros Norte {suffix}", "Analista", "3000000002", $"other.{suffix}@ejemplo.co");
        var repository = new ContactoRepository(_context);

        // WHEN searching by a lowercase substring of the target's nombre
        var result = await repository.GetAllAsync($"pacifico {suffix}".ToLowerInvariant(), CancellationToken.None);

        // THEN only the matching contact is returned
        Assert.Single(result, c => c.Id == target.Id);
    }

    [Fact]
    public async Task GetAllAsync_FiltersByEmailSubstring_IndependentlyOfNombre_R6()
    {
        // GIVEN a contact whose EMAIL contains the search term but whose NOMBRE does
        // NOT — this is the exact regression R6 targets: a Nombre-only filter would
        // silently fail this test (TC-E3-P2-07 backend-path coverage)
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var target = await SeedAsync(
            $"Juan Perez {suffix}",
            "Analista",
            "3000000001",
            $"uniquemail.{suffix}@dominio-especial.co");
        await SeedAsync($"Maria Lopez {suffix}", "Gerente", "3000000002", $"otro.{suffix}@ejemplo.co");
        var repository = new ContactoRepository(_context);

        // WHEN searching by a substring that ONLY exists in the target's email
        var result = await repository.GetAllAsync($"dominio-especial.co", CancellationToken.None);

        // THEN the contact matches via its Email field, not its Nombre
        Assert.Contains(result, c => c.Id == target.Id);
    }

    [Fact]
    public async Task GetAllAsync_WithSearchTermMatchingOnlyEmail_DoesNotReturnUnrelatedContacts()
    {
        // GIVEN a contact whose email matches, and an unrelated contact that
        // matches neither Nombre nor Email
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var target = await SeedAsync($"Contacto Correo {suffix}", "Analista", "3000000001", $"buscado.{suffix}@empresa.com");
        var unrelated = await SeedAsync($"Contacto Ajeno {suffix}", "Gerente", "3000000002", $"ajeno.{suffix}@empresa.com");
        var repository = new ContactoRepository(_context);

        // WHEN searching for the target's unique email substring
        var result = await repository.GetAllAsync($"buscado.{suffix}", CancellationToken.None);

        // THEN only the target is returned
        Assert.Contains(result, c => c.Id == target.Id);
        Assert.DoesNotContain(result, c => c.Id == unrelated.Id);
    }

    [Fact]
    public async Task GetAllAsync_WithNonMatchingSearchTerm_ReturnsEmpty()
    {
        // GIVEN a seeded contact
        var suffix = Guid.NewGuid().ToString("N")[..8];
        await SeedAsync($"Contacto Cualquiera {suffix}", "Analista", "3000000000", $"cualquiera.{suffix}@ejemplo.co");
        var repository = new ContactoRepository(_context);

        // WHEN searching for a term that matches neither Nombre nor Email
        var result = await repository.GetAllAsync($"zzzz-no-match-{suffix}", CancellationToken.None);

        // THEN no results are returned
        Assert.Empty(result);
    }

    [Fact]
    public async Task GetAllAsync_OrdersByCreatedAtDescending()
    {
        // GIVEN two contacts seeded in sequence (created_at increases monotonically)
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var older = await SeedAsync($"Contacto Viejo {suffix}", "Analista", "3000000001", $"viejo.{suffix}@ejemplo.co");
        await Task.Delay(10);
        var newer = await SeedAsync($"Contacto Nuevo {suffix}", "Analista", "3000000002", $"nuevo.{suffix}@ejemplo.co");
        var repository = new ContactoRepository(_context);

        // WHEN fetching all contacts
        var result = await repository.GetAllAsync(null, CancellationToken.None);
        var indices = result.Select((c, i) => (c.Id, i)).ToDictionary(x => x.Id, x => x.i);

        // THEN the more recently created contact appears before the older one
        Assert.True(indices[newer.Id] < indices[older.Id]);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task GetAllAsync_WithWhitespaceOnlySearchTerm_ReturnsAllContactos(string searchTerm)
    {
        // GIVEN two seeded contacts
        var suffix = Guid.NewGuid().ToString("N")[..8];
        await SeedAsync($"Whitespace Alpha {suffix}", "Analista", "3000000001", $"wsa.{suffix}@ejemplo.co");
        await SeedAsync($"Whitespace Beta {suffix}", "Analista", "3000000002", $"wsb.{suffix}@ejemplo.co");
        var repository = new ContactoRepository(_context);

        // WHEN searching with an empty/whitespace-only term
        var result = await repository.GetAllAsync(searchTerm, CancellationToken.None);

        // THEN it behaves like a null search term (no filter applied) — both match
        Assert.Contains(result, c => c.Nombre == $"Whitespace Alpha {suffix}");
        Assert.Contains(result, c => c.Nombre == $"Whitespace Beta {suffix}");
    }

    // --- TC-E3-P0-02 / R1: schema-reuse regression gate -------------------------
    //
    // Cross-cutting regression proving Epic 3's new repository/endpoint layer
    // sits correctly on top of the UNCHANGED FK `fk_contactos_clientes`
    // (`ON DELETE SET NULL`) that Story 2.5's TC-E2-P0-03 already validated.
    // MUST run against real PostgreSQL (this test class already does) since
    // EF Core InMemory does not enforce FK ON DELETE behavior.

    [Fact]
    public async Task DeleteCliente_WithContactosCreatedThroughContactoRepositoryPath_StillOrphansThemViaFkSetNull()
    {
        // GIVEN a client with two contacts created via the NEW Contacto read
        // path this story introduces (proving the new layer doesn't disturb
        // the existing FK contract — TC-E3-P0-02)
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var cliente = await SeedClienteAsync($"Cliente FK Regresion {suffix}", $"FKR{suffix}");
        var contactoRepository = new ContactoRepository(_context);
        var contactoA = await SeedAsync($"Contacto FK A {suffix}", "Analista", "3000000001", $"fka.{suffix}@ejemplo.co", cliente.Id);
        var contactoB = await SeedAsync($"Contacto FK B {suffix}", "Analista", "3000000002", $"fkb.{suffix}@ejemplo.co", cliente.Id);

        // Sanity check: the new repository's read path sees both contacts
        // correctly associated with the client before deletion
        var beforeDelete = await contactoRepository.GetAllAsync(null, CancellationToken.None);
        Assert.Contains(beforeDelete, c => c.Id == contactoA.Id && c.ClienteId == cliente.Id);
        Assert.Contains(beforeDelete, c => c.Id == contactoB.Id && c.ClienteId == cliente.Id);

        // WHEN the client is deleted via a direct SQL DELETE (exercising the
        // database's ON DELETE SET NULL FK behavior, not application code)
        await _context.Clientes.Where(c => c.Id == cliente.Id).ExecuteDeleteAsync();
        _createdClienteIds.Remove(cliente.Id);

        // THEN both contacts still exist (not cascade-deleted), with ClienteId
        // nulled by the database's fk_contactos_clientes FK — queried via a
        // fresh context to bypass any stale identity-map state
        await using var freshContext = new AppDbContext(
            new DbContextOptionsBuilder<AppDbContext>()
                .UseNpgsql(ConnectionString, npgsql => { })
                .ReplaceService<IHistoryRepository, SnakeCaseNpgsqlHistoryRepository>()
                .Options);
        var freshRepository = new ContactoRepository(freshContext);
        var afterDelete = await freshRepository.GetAllAsync(null, CancellationToken.None);
        var survivingA = afterDelete.SingleOrDefault(c => c.Id == contactoA.Id);
        var survivingB = afterDelete.SingleOrDefault(c => c.Id == contactoB.Id);

        Assert.NotNull(survivingA);
        Assert.NotNull(survivingB);
        Assert.Null(survivingA!.ClienteId);
        Assert.Null(survivingB!.ClienteId);
    }

    // --- Story 3.2: GetByIdAsync (AC #1, #2, #3) --------------------------------
    //
    // RED PHASE: IContactoRepository.GetByIdAsync does not exist yet (Story 3.2,
    // Task 1). These tests define the expected contract: returns the matching
    // entity for an existing Id, and null (no exception) for a non-existent Id.
    // Mirrors ClienteRepositoryTests' GetByIdAsync coverage exactly.

    [Fact]
    public async Task GetByIdAsync_WithExistingId_ReturnsTheMatchingEntity()
    {
        // GIVEN a seeded contact
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var seeded = await SeedAsync($"Detalle Contacto {suffix}", "Analista", "3000000001", $"detalle.{suffix}@ejemplo.co");
        var repository = new ContactoRepository(_context);

        // WHEN fetching by its Id
        var result = await repository.GetByIdAsync(seeded.Id, CancellationToken.None);

        // THEN the matching entity is returned with the correct Id
        Assert.NotNull(result);
        Assert.Equal(seeded.Id, result!.Id);
    }

    [Fact]
    public async Task GetByIdAsync_WithNonExistentId_ReturnsNull()
    {
        // GIVEN a well-formed Id that matches no seeded contact
        var repository = new ContactoRepository(_context);
        var nonExistentId = Guid.NewGuid();

        // WHEN fetching by that Id
        var result = await repository.GetByIdAsync(nonExistentId, CancellationToken.None);

        // THEN null is returned — no exception thrown at repository level
        Assert.Null(result);
    }

    // --- Edge cases (mirrors ClienteRepositoryTests' GetByIdAsync edge cases) --

    [Fact]
    public async Task GetByIdAsync_WithGuidEmpty_ReturnsNullNotAnException()
    {
        // GIVEN the well-formed but all-zeros GUID explicitly called out in the
        // story's AC #3 example ("a well-formed UUID with no matching record") —
        // guards against any accidental special-casing of Guid.Empty
        var repository = new ContactoRepository(_context);

        // WHEN fetching by Guid.Empty
        var result = await repository.GetByIdAsync(Guid.Empty, CancellationToken.None);

        // THEN it is treated identically to any other non-existent Id — null, no exception
        Assert.Null(result);
    }

    [Fact]
    public async Task GetByIdAsync_DoesNotReturnAContactoDeletedAfterBeingSeeded()
    {
        // GIVEN a contact that was seeded and then removed from the database
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var seeded = await SeedAsync($"Eliminado Contacto {suffix}", "Analista", "3000000002", $"eliminado.{suffix}@ejemplo.co");
        _context.Set<ContactoEntity>().Remove(seeded);
        await _context.SaveChangesAsync();
        _createdContactoIds.Remove(seeded.Id);
        var repository = new ContactoRepository(_context);

        // WHEN fetching by the now-deleted contact's Id
        var result = await repository.GetByIdAsync(seeded.Id, CancellationToken.None);

        // THEN null is returned, consistent with the non-existent-Id contract
        Assert.Null(result);
    }

    [Fact]
    public async Task GetByIdAsync_WithExistingId_ReturnsEntityWithAssociatedClienteId()
    {
        // GIVEN a contact associated with a client
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var cliente = await SeedClienteAsync($"Cliente Detalle GetById {suffix}", $"GBI{suffix}");
        var seeded = await SeedAsync($"Contacto Asociado {suffix}", "Gerente", "3000000003", $"asociado.{suffix}@ejemplo.co", cliente.Id);
        var repository = new ContactoRepository(_context);

        // WHEN fetching by its Id
        var result = await repository.GetByIdAsync(seeded.Id, CancellationToken.None);

        // THEN the returned entity carries the correct ClienteId (not cleared/altered)
        Assert.NotNull(result);
        Assert.Equal(cliente.Id, result!.ClienteId);
    }
}
