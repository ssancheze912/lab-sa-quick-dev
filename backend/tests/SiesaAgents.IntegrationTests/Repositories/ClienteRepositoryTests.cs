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
}
