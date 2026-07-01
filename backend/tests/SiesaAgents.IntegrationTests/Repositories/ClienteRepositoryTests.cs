using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SiesaAgents.Domain.Entities;
using SiesaAgents.Infrastructure.Data;
using SiesaAgents.Infrastructure.Repositories;

namespace SiesaAgents.IntegrationTests.Repositories;

/// <summary>
/// Story 2.1 (AC #1, #2): verifies GetAllAsync's search filter and default ordering
/// against a real PostgreSQL connection (required for EF.Functions.ILike, which has
/// no InMemory-provider equivalent). Each test uses its own set of uniquely-named
/// clients (GUID-suffixed) and cleans up afterwards so tests don't interfere with
/// each other or with other suites sharing `siesa_agents_db`.
/// </summary>
public class ClienteRepositoryTests : IAsyncLifetime
{
    private const string ConnectionString =
        "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres";

    private AppDbContext _context = null!;
    private readonly List<Guid> _createdIds = [];

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
        if (_createdIds.Count > 0)
        {
            var toRemove = await _context.Clientes.Where(c => _createdIds.Contains(c.Id)).ToListAsync();
            _context.Clientes.RemoveRange(toRemove);
            await _context.SaveChangesAsync();
        }

        await _context.DisposeAsync();
    }

    private async Task<ClienteEntity> SeedAsync(string nombre, string nit)
    {
        var cliente = ClienteEntity.Create(nombre, nit, "3000000000", "Cali");
        _context.Clientes.Add(cliente);
        await _context.SaveChangesAsync();
        _createdIds.Add(cliente.Id);
        return cliente;
    }

    [Fact]
    public async Task GetAllAsync_WithoutSearchTerm_ReturnsAllClientes()
    {
        // GIVEN two seeded clients
        var suffix = Guid.NewGuid().ToString("N")[..8];
        await SeedAsync($"Alpha Corp {suffix}", $"900{suffix}");
        await SeedAsync($"Beta Corp {suffix}", $"901{suffix}");
        var repository = new ClienteRepository(_context);

        // WHEN fetching all clients with no search term
        var result = await repository.GetAllAsync(null, CancellationToken.None);

        // THEN both seeded clients are present
        Assert.Contains(result, c => c.Nombre == $"Alpha Corp {suffix}");
        Assert.Contains(result, c => c.Nombre == $"Beta Corp {suffix}");
    }

    [Fact]
    public async Task GetAllAsync_FiltersByNombreSubstring_CaseInsensitive()
    {
        // GIVEN clients with distinct names
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var target = await SeedAsync($"Distribuidora Pacifico {suffix}", $"810{suffix}");
        await SeedAsync($"Suministros Norte {suffix}", $"811{suffix}");
        var repository = new ClienteRepository(_context);

        // WHEN searching by a lowercase substring of the target's nombre
        var result = await repository.GetAllAsync($"pacifico {suffix}".ToLowerInvariant(), CancellationToken.None);

        // THEN only the matching client is returned
        Assert.Single(result, c => c.Id == target.Id);
    }

    [Fact]
    public async Task GetAllAsync_FiltersByNitSubstring()
    {
        // GIVEN clients with distinct NITs
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var target = await SeedAsync($"Cliente Nit Uno {suffix}", $"77012345{suffix}");
        await SeedAsync($"Cliente Nit Dos {suffix}", $"88099999{suffix}");
        var repository = new ClienteRepository(_context);

        // WHEN searching by a substring of the target's NIT
        var result = await repository.GetAllAsync("77012345", CancellationToken.None);

        // THEN only the client whose NIT contains that substring is returned
        Assert.Contains(result, c => c.Id == target.Id);
        Assert.DoesNotContain(result, c => c.Nombre == $"Cliente Nit Dos {suffix}");
    }

    [Fact]
    public async Task GetAllAsync_WithNonMatchingSearchTerm_ReturnsEmpty()
    {
        // GIVEN a seeded client
        var suffix = Guid.NewGuid().ToString("N")[..8];
        await SeedAsync($"Cliente Cualquiera {suffix}", $"999{suffix}");
        var repository = new ClienteRepository(_context);

        // WHEN searching for a term that matches nothing
        var result = await repository.GetAllAsync($"zzzz-no-match-{suffix}", CancellationToken.None);

        // THEN no results are returned
        Assert.Empty(result);
    }

    [Fact]
    public async Task GetAllAsync_OrdersByCreatedAtDescending()
    {
        // GIVEN two clients seeded in sequence (created_at increases monotonically)
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var older = await SeedAsync($"Cliente Viejo {suffix}", $"111{suffix}");
        await Task.Delay(10);
        var newer = await SeedAsync($"Cliente Nuevo {suffix}", $"222{suffix}");
        var repository = new ClienteRepository(_context);

        // WHEN fetching all clients
        var result = await repository.GetAllAsync(null, CancellationToken.None);
        var indices = result.Select((c, i) => (c.Id, i)).ToDictionary(x => x.Id, x => x.i);

        // THEN the more recently created client appears before the older one
        Assert.True(indices[newer.Id] < indices[older.Id]);
    }

    // --- Edge cases (testarch-automate expansion) -----------------------------

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("\t\n")]
    public async Task GetAllAsync_WithWhitespaceOnlySearchTerm_ReturnsAllClientes(string searchTerm)
    {
        // GIVEN two seeded clients
        var suffix = Guid.NewGuid().ToString("N")[..8];
        await SeedAsync($"Whitespace Alpha {suffix}", $"920{suffix}");
        await SeedAsync($"Whitespace Beta {suffix}", $"921{suffix}");
        var repository = new ClienteRepository(_context);

        // WHEN searching with an empty/whitespace-only term
        var result = await repository.GetAllAsync(searchTerm, CancellationToken.None);

        // THEN it behaves like a null search term (no filter applied) — both match
        Assert.Contains(result, c => c.Nombre == $"Whitespace Alpha {suffix}");
        Assert.Contains(result, c => c.Nombre == $"Whitespace Beta {suffix}");
    }

    [Fact]
    public async Task GetAllAsync_WithPercentCharacterInSearchTerm_IsTreatedLiterallyNotAsWildcard()
    {
        // GIVEN a client whose nombre contains a literal '%' character, and another
        // that does not — this guards against ILike's '%' wildcard being
        // unintentionally interpreted from raw, unescaped user input.
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var target = await SeedAsync($"Descuento 10% Cliente {suffix}", $"930{suffix}");
        var unrelated = await SeedAsync($"Cliente Regular {suffix}", $"931{suffix}");
        var repository = new ClienteRepository(_context);

        // WHEN searching using a term containing '%'
        var result = await repository.GetAllAsync($"10% Cliente {suffix}", CancellationToken.None);

        // THEN only the client whose name literally contains that substring matches
        Assert.Contains(result, c => c.Id == target.Id);
        Assert.DoesNotContain(result, c => c.Id == unrelated.Id);
    }

    [Fact]
    public async Task GetAllAsync_WithUnderscoreCharacterInSearchTerm_IsTreatedLiterally()
    {
        // GIVEN a client whose NIT contains an underscore-like separator pattern
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var target = await SeedAsync($"Cliente Guion Bajo {suffix}", $"nit_940{suffix}");
        var repository = new ClienteRepository(_context);

        // WHEN searching with the literal underscore substring
        var result = await repository.GetAllAsync($"nit_940{suffix}", CancellationToken.None);

        // THEN the client matches on the literal substring (not a single-char wildcard)
        Assert.Contains(result, c => c.Id == target.Id);
    }

    [Fact]
    public async Task GetAllAsync_WithSearchTermMatchingNoOneWhenOtherClientsExist_ReturnsEmptyNotAllRecords()
    {
        // GIVEN several unrelated seeded clients
        var suffix = Guid.NewGuid().ToString("N")[..8];
        await SeedAsync($"Uno {suffix}", $"950{suffix}");
        await SeedAsync($"Dos {suffix}", $"951{suffix}");
        await SeedAsync($"Tres {suffix}", $"952{suffix}");
        var repository = new ClienteRepository(_context);

        // WHEN searching for a very long, clearly non-matching term
        var longTerm = new string('z', 200) + suffix;
        var result = await repository.GetAllAsync(longTerm, CancellationToken.None);

        // THEN zero results are returned (not silently falling back to "all")
        Assert.Empty(result);
    }

    [Fact]
    public async Task GetAllAsync_WithAccentedSearchTerm_MatchesAccentedNombre()
    {
        // GIVEN a client with accented characters in its name
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var target = await SeedAsync($"Compañía Bogotá {suffix}", $"960{suffix}");
        var repository = new ClienteRepository(_context);

        // WHEN searching using the same accented substring
        var result = await repository.GetAllAsync($"Bogotá {suffix}", CancellationToken.None);

        // THEN the accented client matches
        Assert.Contains(result, c => c.Id == target.Id);
    }

    // --- Story 2.2: GetByIdAsync (AC #1, #2, #3) --------------------------------
    //
    // RED PHASE: IClienteRepository.GetByIdAsync does not exist yet (Story 2.2,
    // Task 1). These tests define the expected contract: returns the matching
    // entity for an existing Id, and null (no exception) for a non-existent Id.

    [Fact]
    public async Task GetByIdAsync_WithExistingId_ReturnsTheMatchingEntity()
    {
        // GIVEN a seeded client
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var seeded = await SeedAsync($"Detalle Cliente {suffix}", $"980{suffix}");
        var repository = new ClienteRepository(_context);

        // WHEN fetching by its Id
        var result = await repository.GetByIdAsync(seeded.Id, CancellationToken.None);

        // THEN the matching entity is returned with the correct Id
        Assert.NotNull(result);
        Assert.Equal(seeded.Id, result!.Id);
    }

    [Fact]
    public async Task GetByIdAsync_WithNonExistentId_ReturnsNull()
    {
        // GIVEN a well-formed Id that matches no seeded client
        var repository = new ClienteRepository(_context);
        var nonExistentId = Guid.NewGuid();

        // WHEN fetching by that Id
        var result = await repository.GetByIdAsync(nonExistentId, CancellationToken.None);

        // THEN null is returned — no exception thrown at repository level
        Assert.Null(result);
    }

    // --- Edge cases (testarch-automate expansion) -----------------------------

    [Fact]
    public async Task GetByIdAsync_WithGuidEmpty_ReturnsNullNotAnException()
    {
        // GIVEN the well-formed but all-zeros GUID explicitly called out in the
        // story's AC #3 example ("a well-formed UUID with no matching record") —
        // guards against any accidental special-casing of Guid.Empty (e.g. a
        // default-value check that short-circuits differently from a random Id)
        var repository = new ClienteRepository(_context);

        // WHEN fetching by Guid.Empty
        var result = await repository.GetByIdAsync(Guid.Empty, CancellationToken.None);

        // THEN it is treated identically to any other non-existent Id — null, no exception
        Assert.Null(result);
    }

    [Fact]
    public async Task GetByIdAsync_DoesNotReturnAClienteDeletedAfterBeingSeeded()
    {
        // GIVEN a client that was seeded and then removed from the database
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var seeded = await SeedAsync($"Eliminado Cliente {suffix}", $"981{suffix}");
        _context.Clientes.Remove(seeded);
        await _context.SaveChangesAsync();
        _createdIds.Remove(seeded.Id);
        var repository = new ClienteRepository(_context);

        // WHEN fetching by the now-deleted client's Id
        var result = await repository.GetByIdAsync(seeded.Id, CancellationToken.None);

        // THEN null is returned, consistent with the non-existent-Id contract
        Assert.Null(result);
    }

    // --- Story 2.3: AddAsync (AC #2, #4, #5) ------------------------------------
    //
    // RED PHASE: IClienteRepository.AddAsync does not exist yet (Story 2.3,
    // Task 1). These tests define the expected contract: persists a valid
    // client, and lets a Postgres unique-violation on `uk_clientes_nit`
    // propagate as a DbUpdateException (no pre-check query — DB constraint is
    // the race-condition-safe source of truth per Dev Notes).

    [Fact]
    public async Task AddAsync_WithValidCliente_PersistsItAndIsRetrievableAfterwards()
    {
        // GIVEN a new, valid ClienteEntity built via the domain factory
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var cliente = ClienteEntity.Create($"Nuevo Cliente {suffix}", $"AA{suffix}", "3000000001", "Medellín");
        var repository = new ClienteRepository(_context);

        // WHEN persisting it via AddAsync
        await repository.AddAsync(cliente, CancellationToken.None);
        _createdIds.Add(cliente.Id);

        // THEN it can be retrieved back from the database by Id
        var persisted = await repository.GetByIdAsync(cliente.Id, CancellationToken.None);
        Assert.NotNull(persisted);
        Assert.Equal(cliente.Nombre, persisted!.Nombre);
        Assert.Equal(cliente.Nit, persisted.Nit);
    }

    [Fact]
    public async Task AddAsync_WithDuplicateNit_ThrowsDbUpdateExceptionFromUniqueConstraint()
    {
        // GIVEN an already-persisted client with a known NIT/RUC
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var existing = await SeedAsync($"Original Cliente {suffix}", $"DUP{suffix}");
        var repository = new ClienteRepository(_context);

        // WHEN attempting to add a second client with the same NIT/RUC (different Nombre)
        var duplicate = ClienteEntity.Create($"Otro Nombre {suffix}", existing.Nit, "3000000002", "Cali");

        // THEN the database's uk_clientes_nit unique constraint rejects the insert
        // as a DbUpdateException — no application-level pre-check query is used,
        // relying on the DB as the race-condition-safe source of truth.
        await Assert.ThrowsAsync<DbUpdateException>(
            async () => await repository.AddAsync(duplicate, CancellationToken.None));
    }

    // --- Story 2.4: UpdateAsync (AC #2, #3, #7) ---------------------------------
    //
    // RED PHASE: IClienteRepository.UpdateAsync does not exist yet (Story 2.4,
    // Task 1). These tests define the expected contract: happy-path update
    // persists the mutated fields and bumps UpdatedAt; a non-existent Id
    // returns null (404 case, no exception); a duplicate-NIT-from-a-different-
    // client update propagates as DbUpdateException (same race-condition-safe
    // pattern as AddAsync); and a self-update with an unchanged NIT does NOT
    // throw (self-exclusion, AC #7).

    [Fact]
    public async Task UpdateAsync_WithValidChanges_PersistsAndReturnsTheUpdatedEntity()
    {
        // GIVEN an existing seeded client
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var seeded = await SeedAsync($"Original Update {suffix}", $"UPD{suffix}");
        var repository = new ClienteRepository(_context);
        var tracked = await repository.GetByIdAsync(seeded.Id, CancellationToken.None);
        tracked!.Update($"Actualizado {suffix}", seeded.Nit, "3009999999", "Pereira");

        // WHEN updating it via UpdateAsync
        var result = await repository.UpdateAsync(tracked, CancellationToken.None);

        // THEN the returned entity reflects the new values
        Assert.NotNull(result);
        Assert.Equal($"Actualizado {suffix}", result!.Nombre);
        Assert.Equal("3009999999", result.Telefono);
        Assert.Equal("Pereira", result.Ciudad);
    }

    [Fact]
    public async Task UpdateAsync_WithValidChanges_PersistsChangesRetrievableAfterwards()
    {
        // GIVEN an existing seeded client
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var seeded = await SeedAsync($"Persistido Update {suffix}", $"PERS{suffix}");
        var repository = new ClienteRepository(_context);
        var tracked = await repository.GetByIdAsync(seeded.Id, CancellationToken.None);
        tracked!.Update($"Persistido Cambiado {suffix}", seeded.Nit, "3001112222", "Manizales");

        // WHEN updating it and then fetching it again in a fresh query
        await repository.UpdateAsync(tracked, CancellationToken.None);
        var refetched = await repository.GetByIdAsync(seeded.Id, CancellationToken.None);

        // THEN the persisted row reflects the update, not the original values
        Assert.NotNull(refetched);
        Assert.Equal($"Persistido Cambiado {suffix}", refetched!.Nombre);
        Assert.Equal("Manizales", refetched.Ciudad);
    }

    [Fact]
    public async Task UpdateAsync_BumpsUpdatedAtButDoesNotChangeCreatedAtOrId()
    {
        // GIVEN an existing seeded client
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var seeded = await SeedAsync($"Timestamps {suffix}", $"TS{suffix}");
        var originalCreatedAt = seeded.CreatedAt;
        var originalUpdatedAt = seeded.UpdatedAt;
        var repository = new ClienteRepository(_context);
        await Task.Delay(10);
        var tracked = await repository.GetByIdAsync(seeded.Id, CancellationToken.None);
        tracked!.Update("Nombre Cambiado", seeded.Nit, seeded.Telefono, "Cartagena");

        // WHEN updating it
        var result = await repository.UpdateAsync(tracked, CancellationToken.None);

        // THEN Id and CreatedAt are untouched, UpdatedAt has advanced
        Assert.NotNull(result);
        Assert.Equal(seeded.Id, result!.Id);
        Assert.Equal(originalCreatedAt, result.CreatedAt);
        Assert.True(result.UpdatedAt > originalUpdatedAt);
    }

    [Fact]
    public async Task UpdateAsync_WithNonExistentEntity_ReturnsNull()
    {
        // GIVEN an entity built in-memory that was never persisted (simulates the
        // 404 case a handler would hit after GetByIdAsync returns null upstream —
        // this test exercises UpdateAsync's own defensive contract directly)
        var repository = new ClienteRepository(_context);
        var neverPersisted = ClienteEntity.Create("Fantasma", "FANTASMA-NIT", "3000000000", "Cali");

        // WHEN attempting to update it
        var result = await repository.UpdateAsync(neverPersisted, CancellationToken.None);

        // THEN null is returned — no exception, no accidental insert
        Assert.Null(result);
    }

    [Fact]
    public async Task UpdateAsync_WithNitCollidingWithADifferentClient_ThrowsDbUpdateException()
    {
        // GIVEN two existing clients with distinct NITs
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var clientA = await SeedAsync($"Cliente A {suffix}", $"NITA{suffix}");
        var clientB = await SeedAsync($"Cliente B {suffix}", $"NITB{suffix}");
        var repository = new ClienteRepository(_context);
        var trackedB = await repository.GetByIdAsync(clientB.Id, CancellationToken.None);
        trackedB!.Update(trackedB.Nombre, clientA.Nit, trackedB.Telefono, trackedB.Ciudad);

        // WHEN updating client B to use client A's NIT/RUC
        // THEN the uk_clientes_nit unique constraint rejects it as a
        // DbUpdateException (AC #5/#7 — collision with a DIFFERENT client)
        await Assert.ThrowsAsync<DbUpdateException>(
            async () => await repository.UpdateAsync(trackedB, CancellationToken.None));
    }

    [Fact]
    public async Task UpdateAsync_WithSelfUnchangedNit_DoesNotThrow()
    {
        // GIVEN an existing client whose NIT is left unchanged in the update
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var seeded = await SeedAsync($"Self Update {suffix}", $"SELF{suffix}");
        var repository = new ClienteRepository(_context);
        var tracked = await repository.GetByIdAsync(seeded.Id, CancellationToken.None);
        tracked!.Update("Self Update Renombrado", seeded.Nit, seeded.Telefono, "Ibagué");

        // WHEN updating it with its OWN unchanged NIT (no actual collision)
        var result = await repository.UpdateAsync(tracked, CancellationToken.None);

        // THEN the update succeeds — self-exclusion behavior (AC #7), the DB
        // constraint is per-value and the row already holds that NIT
        Assert.NotNull(result);
        Assert.Equal("Self Update Renombrado", result!.Nombre);
        Assert.Equal(seeded.Nit, result.Nit);
    }
}
