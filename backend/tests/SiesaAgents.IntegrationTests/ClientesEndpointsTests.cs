using System;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.IntegrationTests.Fixtures;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// ATDD (RED phase) integration tests for Story 2.1 — Client List & Search.
///
/// Covers Acceptance Criterion #10 (three named tests):
///   * <c>GetClientes_WhenEmpty_Returns200WithEmptyArray</c>
///   * <c>GetClientes_WhenSeeded_ReturnsAllInCamelCaseShape</c>
///   * <c>ClientesTable_AfterMigration_HasSnakeCaseColumns</c>
///
/// These tests are expected to FAIL until:
///   1. <c>SiesaAgents.Domain.Clientes.Entities.ClienteEntity</c> exists.
///   2. <c>AppDbContext.Clientes</c> DbSet is declared.
///   3. <c>ClienteConfiguration</c> maps the entity to the canonical
///      <c>clientes</c> table with the snake_case column names listed in AC #8
///      and the unique index <c>uk_clientes_nit</c>.
///   4. <c>ClienteEndpoints.MapClienteEndpoints</c> registers
///      <c>GET /api/v1/clientes</c>.
/// </summary>
public class ClientesEndpointsTests : IClassFixture<SiesaAgentsApiFactory>
{
    private readonly SiesaAgentsApiFactory _factory;

    public ClientesEndpointsTests(SiesaAgentsApiFactory factory)
    {
        _factory = factory;
    }

    /// <summary>
    /// AC #10 / AC #6 — empty result returns HTTP 200 with `[]`, NOT `null`.
    ///
    /// GIVEN the clientes table is empty.
    /// WHEN  GET /api/v1/clientes is issued.
    /// THEN  Status is 200; Content-Type is application/json; body is `[]`.
    /// </summary>
    [Fact]
    public async Task GetClientes_WhenEmpty_Returns200WithEmptyArray()
    {
        // GIVEN: a factory configured to expose an empty in-memory DB.
        using var client = CreateClientWithCleanInMemoryDb(out _);

        // WHEN
        using var response = await client.GetAsync("/api/v1/clientes");

        // THEN
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);

        var raw = await response.Content.ReadAsStringAsync();
        Assert.Equal("[]", raw.Trim());
    }

    /// <summary>
    /// AC #10 / AC #6 — seeded clientes are returned with camelCase JSON shape.
    ///
    /// GIVEN two clientes are seeded directly through the AppDbContext.
    /// WHEN  GET /api/v1/clientes is issued.
    /// THEN  Status is 200; both clientes appear; properties are serialized as
    ///       camelCase (createdAt, updatedAt — not snake_case, not PascalCase).
    /// </summary>
    [Fact]
    public async Task GetClientes_WhenSeeded_ReturnsAllInCamelCaseShape()
    {
        // GIVEN: a factory configured with an in-memory DB, then seed 2 clientes.
        using var client = CreateClientWithCleanInMemoryDb(out var factory);
        SeedTwoClientes(factory);

        // WHEN
        using var response = await client.GetAsync("/api/v1/clientes");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var raw = await response.Content.ReadAsStringAsync();

        // THEN: camelCase keys are present (camelCase contract from Story 1.3).
        Assert.Contains("\"createdAt\"", raw);
        Assert.Contains("\"updatedAt\"", raw);
        Assert.Contains("\"nombre\"", raw);
        Assert.Contains("\"nit\"", raw);

        // Negative — NEVER snake_case or PascalCase keys at the API surface.
        Assert.DoesNotContain("\"created_at\"", raw);
        Assert.DoesNotContain("\"CreatedAt\"", raw);
        Assert.DoesNotContain("\"Nombre\"", raw);

        // Parse and assert both clientes are present.
        using var doc = JsonDocument.Parse(raw);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        Assert.Equal(2, doc.RootElement.GetArrayLength());

        var names = doc.RootElement.EnumerateArray()
            .Select(e => e.GetProperty("nombre").GetString())
            .ToHashSet();

        Assert.Contains("Cliente Alfa", names);
        Assert.Contains("Cliente Beta", names);
    }

    /// <summary>
    /// AC #10 / AC #8 — runtime EF model maps ClienteEntity to the canonical
    /// snake_case `clientes` table with the seven columns and the unique
    /// index `uk_clientes_nit`.
    ///
    /// Matches the pattern of <see cref="SnakeCaseConventionTests"/> from
    /// Story 1.3 — we inspect the EF Core <see cref="IModel"/> instead of
    /// hitting PostgreSQL so the test stays deterministic and host-agnostic.
    /// </summary>
    [Fact]
    public void ClientesTable_AfterMigration_HasSnakeCaseColumns()
    {
        // GIVEN: a real AppDbContext wired with the production OnModelCreating.
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"clientes-model-test-{Guid.NewGuid()}")
            .Options;

        using var ctx = new AppDbContext(options);

        // WHEN: locate the ClienteEntity in the materialized model.
        var clrType = LocateClienteEntityType();
        var entity = ctx.Model.FindEntityType(clrType);
        Assert.NotNull(entity);

        // THEN: table name is `clientes` (snake_case + canonical plural).
        Assert.Equal("clientes", entity!.GetTableName());

        // AND: every expected column exists in snake_case.
        var columnNames = entity.GetProperties()
            .Select(p => p.GetColumnName())
            .Where(n => n is not null)
            .ToHashSet();

        Assert.Contains("id", columnNames);
        Assert.Contains("nombre", columnNames);
        Assert.Contains("nit", columnNames);
        Assert.Contains("telefono", columnNames);
        Assert.Contains("ciudad", columnNames);
        Assert.Contains("created_at", columnNames);
        Assert.Contains("updated_at", columnNames);

        // AND: the unique index for `nit` is `uk_clientes_nit`.
        var indexNames = entity.GetIndexes()
            .Where(i => i.IsUnique)
            .Select(i => i.GetDatabaseName())
            .Where(n => n is not null)
            .ToHashSet();

        Assert.Contains("uk_clientes_nit", indexNames);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers — swap the EF Core provider for InMemory so tests are isolated
    // from a live PostgreSQL instance.
    // ─────────────────────────────────────────────────────────────────────────

    private HttpClient CreateClientWithCleanInMemoryDb(out InMemoryFactory factory)
    {
        // Build a sibling factory that overrides the production DbContext
        // registration with an InMemory provider. Each test gets a fresh
        // database name so state never leaks across tests.
        factory = new InMemoryFactory(Guid.NewGuid().ToString());
        var client = factory.CreateClient();

        // Ensure the schema exists for the in-memory store.
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.EnsureCreated();

        return client;
    }

    private static void SeedTwoClientes(InMemoryFactory factory)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var clrType = LocateClienteEntityType();
        var createMethod = clrType.GetMethod("Create",
            new[] { typeof(string), typeof(string), typeof(string), typeof(string) });

        Assert.NotNull(createMethod);

        var alfa = createMethod!.Invoke(null, new object?[] { "Cliente Alfa", "900111222-1", null, null });
        var beta = createMethod.Invoke(null, new object?[] { "Cliente Beta", "900222333-2", null, null });

        Assert.NotNull(alfa);
        Assert.NotNull(beta);

        db.Add(alfa!);
        db.Add(beta!);
        db.SaveChanges();
    }

    private static Type LocateClienteEntityType()
    {
        var asm = typeof(AppDbContext).Assembly;
        // Walk the referenced Domain assembly to find ClienteEntity. We can't
        // hard-reference SiesaAgents.Domain.* by type because the test project
        // does not reference it directly — Infrastructure does.
        var domainAsm = asm.GetReferencedAssemblies()
            .Select(System.Reflection.Assembly.Load)
            .FirstOrDefault(a => a.GetName().Name == "SiesaAgents.Domain");

        Assert.NotNull(domainAsm);

        var clrType = domainAsm!.GetType("SiesaAgents.Domain.Clientes.Entities.ClienteEntity");
        Assert.NotNull(clrType);
        return clrType!;
    }
}

/// <summary>
/// Variant of <see cref="SiesaAgentsApiFactory"/> that swaps the Npgsql
/// provider for InMemory so endpoint tests don't require a live PostgreSQL
/// instance. The database name is randomized per test instance to isolate
/// state across the test class.
/// </summary>
internal sealed class InMemoryFactory : SiesaAgentsApiFactory
{
    private readonly string _dbName;

    public InMemoryFactory(string dbName)
    {
        _dbName = dbName;
    }

    protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);
        builder.ConfigureServices(services =>
        {
            // Wipe every EF Core / Npgsql-related service that Program.cs
            // registered. Removing just the DbContextOptions descriptor is
            // not enough because EF Core's internal service provider also
            // remembers the Npgsql provider services. The safest path is to
            // remove ALL services whose type lives in an EntityFrameworkCore
            // / Npgsql assembly and then re-register a clean InMemory
            // DbContext.
            var toRemove = services.Where(d =>
                (d.ServiceType.FullName?.StartsWith("Microsoft.EntityFrameworkCore") ?? false) ||
                (d.ServiceType.FullName?.StartsWith("Npgsql") ?? false) ||
                d.ServiceType == typeof(AppDbContext) ||
                d.ServiceType == typeof(DbContextOptions) ||
                d.ServiceType == typeof(DbContextOptions<AppDbContext>)
            ).ToList();
            foreach (var d in toRemove) services.Remove(d);

            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase(_dbName));
        });
    }
}
