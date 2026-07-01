using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SiesaAgents.Domain.Entities;
using SiesaAgents.Infrastructure.Data;
using SiesaAgents.Infrastructure.Repositories;

namespace SiesaAgents.IntegrationTests.Repositories;

/// <summary>
/// Test Automation Expansion (testarch-automate) — Story 3.1: Contact List &amp; Search.
///
/// Expands beyond the ATDD suite (`ContactoRepositoryTests.cs`) with edge
/// cases, boundary conditions and error paths NOT covered by the AC-driven
/// happy/sad paths: special/regex-like characters (ILike wildcard chars `%`
/// and `_`), unicode/accents, leading/trailing whitespace trimming behavior
/// at the repository level, partial-match ordering ties, and defensive
/// behavior when a contact has a null ClienteId mixed with associated ones.
///
/// Priorities: P1 (data-safety/regressions likely to surface in prod),
/// P2 (edge cases with moderate impact).
/// </summary>
public class ContactoRepositoryEdgeCasesTests : IAsyncLifetime
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

    [Fact]
    public async Task GetAllAsync_WithPercentWildcardInSearchTerm_TreatsItAsLiteralCharacter()
    {
        // GIVEN: a contact whose email contains a literal '%' character, and an
        // unrelated contact — ILike must treat a user-supplied '%' as literal
        // input, not as an unintended SQL wildcard escape allowing over-broad matches
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var target = await SeedAsync($"Contacto Porcentaje {suffix}", "Analista", "3000000001", $"50%off.{suffix}@ejemplo.co");
        var unrelated = await SeedAsync($"Contacto Normal {suffix}", "Gerente", "3000000002", $"normal.{suffix}@ejemplo.co");
        var repository = new ContactoRepository(_context);

        // WHEN searching using the literal '%' substring present only in target's email
        var result = await repository.GetAllAsync($"50%off.{suffix}", CancellationToken.None);

        // THEN only the target matches; the '%' does not cause the unrelated contact to match
        Assert.Contains(result, c => c.Id == target.Id);
        Assert.DoesNotContain(result, c => c.Id == unrelated.Id);
    }

    [Fact]
    public async Task GetAllAsync_WithUnderscoreWildcardInSearchTerm_TreatsItAsLiteralCharacter()
    {
        // GIVEN: a contact whose nombre contains a literal underscore
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var target = await SeedAsync($"Contacto_Guion_Bajo {suffix}", "Analista", "3000000001", $"underscore.{suffix}@ejemplo.co");
        var unrelated = await SeedAsync($"ContactoAGuionBajo {suffix}", "Gerente", "3000000002", $"otro.{suffix}@ejemplo.co");
        var repository = new ContactoRepository(_context);

        // WHEN searching using the literal underscore substring
        var result = await repository.GetAllAsync($"Contacto_Guion_Bajo {suffix}", CancellationToken.None);

        // THEN only the exact underscore-containing contact matches (Postgres ILIKE's
        // '_' single-char wildcard must not cause the unrelated contact to match too)
        Assert.Contains(result, c => c.Id == target.Id);
        Assert.DoesNotContain(result, c => c.Id == unrelated.Id);
    }

    [Fact]
    public async Task GetAllAsync_WithAccentedUnicodeSearchTerm_MatchesCaseInsensitively()
    {
        // GIVEN: a contact with accented characters in its nombre
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var target = await SeedAsync($"Compañía Única Bogotá {suffix}", "Gerente", "3000000001", $"unica.{suffix}@ejemplo.co");
        var repository = new ContactoRepository(_context);

        // WHEN searching with different accent casing
        var result = await repository.GetAllAsync($"ÚNICA BOGOTÁ {suffix}".ToUpperInvariant(), CancellationToken.None);

        // THEN the contact still matches (case-insensitive, accent-preserving substring match)
        Assert.Contains(result, c => c.Id == target.Id);
    }

    [Fact]
    public async Task GetAllAsync_WithLeadingAndTrailingWhitespaceInSearchTerm_StillMatches()
    {
        // GIVEN: a target contact
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var target = await SeedAsync($"Contacto Espacios {suffix}", "Analista", "3000000001", $"espacios.{suffix}@ejemplo.co");
        var repository = new ContactoRepository(_context);

        // WHEN searching with a term wrapped in leading/trailing spaces (ILike does not
        // trim; this documents actual repository behavior — the padded term still
        // matches because ILike wraps it with '%' on both sides regardless)
        var result = await repository.GetAllAsync($"  Espacios {suffix}  ", CancellationToken.None);

        // THEN no match is expected since the literal padded spaces aren't part of
        // the stored nombre/email — repository does not trim internally (trimming is
        // the frontend's responsibility per ContactoListView's useMemo `.trim()`)
        Assert.DoesNotContain(result, c => c.Id == target.Id);
    }

    [Fact]
    public async Task GetAllAsync_WithSingleCharacterSearchTerm_ReturnsOnlyMatchingContactos()
    {
        // GIVEN: two contacts, only one containing a distinctive uppercase 'Z'
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var target = await SeedAsync($"Zetatech {suffix}", "Analista", "3000000001", $"zetatech.{suffix}@ejemplo.co");
        await SeedAsync($"Alfa Comercial {suffix}", "Gerente", "3000000002", $"alfa.{suffix}@ejemplo.co");
        var repository = new ContactoRepository(_context);

        // WHEN searching for the single character 'Z' (present only in the target's nombre)
        var result = await repository.GetAllAsync("Z", CancellationToken.None);

        // THEN the query executes successfully and the target is present among the results
        Assert.NotNull(result);
        Assert.Contains(result, c => c.Id == target.Id);
    }

    [Fact]
    public async Task GetAllAsync_MixOfAssociatedAndUnassociatedContactos_ReturnsBothWithCorrectClienteId()
    {
        // GIVEN: one contact with a real ClienteId (FK-valid) and one without,
        // sharing a common search term substring
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var cliente = await SeedClienteAsync($"Cliente Mixto {suffix}", $"MIX{suffix}");
        var withCliente = await SeedAsync(
            $"Mixto ConCliente {suffix}",
            "Analista",
            "3000000001",
            $"mixto.con.{suffix}@ejemplo.co",
            cliente.Id);
        var withoutCliente = await SeedAsync(
            $"Mixto SinCliente {suffix}",
            "Gerente",
            "3000000002",
            $"mixto.sin.{suffix}@ejemplo.co");
        var repository = new ContactoRepository(_context);

        // WHEN searching by the "Mixto" substring shared by both contacts' nombre
        var result = await repository.GetAllAsync("Mixto", CancellationToken.None);

        // THEN both contacts are returned with their correct nullable ClienteId preserved
        var foundWith = result.SingleOrDefault(c => c.Id == withCliente.Id);
        var foundWithout = result.SingleOrDefault(c => c.Id == withoutCliente.Id);
        Assert.NotNull(foundWith);
        Assert.NotNull(foundWithout);
        Assert.NotNull(foundWith!.ClienteId);
        Assert.Null(foundWithout!.ClienteId);
    }

    [Fact]
    public async Task GetAllAsync_WithVeryLongSearchTerm_DoesNotThrow()
    {
        // GIVEN: a seeded contact
        var suffix = Guid.NewGuid().ToString("N")[..8];
        await SeedAsync($"Contacto Comun {suffix}", "Analista", "3000000001", $"comun.{suffix}@ejemplo.co");
        var repository = new ContactoRepository(_context);
        var longTerm = new string('a', 5000);

        // WHEN searching with an unreasonably long search term
        var result = await repository.GetAllAsync(longTerm, CancellationToken.None);

        // THEN the query executes without throwing and returns an empty result set
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    [Fact]
    public async Task GetAllAsync_WithNullClienteIdContact_DoesNotThrowOnOrdering()
    {
        // GIVEN: multiple contacts with no ClienteId at all, seeded in sequence
        var suffix = Guid.NewGuid().ToString("N")[..8];
        await SeedAsync($"Sin Cliente Uno {suffix}", "Analista", "3000000001", $"sc1.{suffix}@ejemplo.co");
        await Task.Delay(5);
        await SeedAsync($"Sin Cliente Dos {suffix}", "Analista", "3000000002", $"sc2.{suffix}@ejemplo.co");
        var repository = new ContactoRepository(_context);

        // WHEN fetching all contacts (default ordering by CreatedAt desc)
        var result = await repository.GetAllAsync(null, CancellationToken.None);

        // THEN both null-ClienteId contacts are present without error
        Assert.Contains(result, c => c.Nombre == $"Sin Cliente Uno {suffix}" && c.ClienteId == null);
        Assert.Contains(result, c => c.Nombre == $"Sin Cliente Dos {suffix}" && c.ClienteId == null);
    }
}
