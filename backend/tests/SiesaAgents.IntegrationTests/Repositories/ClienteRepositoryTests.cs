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
}
