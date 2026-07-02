// -----------------------------------------------------------------------------
//  Story 2.1 — Client List & Search
//  Integration tests for GET /api/v1/clientes (AC #8, #5).
//
//  Sandbox note: the local environment has no Docker (per test-design R-013
//  fallback), so this suite swaps the Npgsql-backed AppDbContext for the EF
//  Core InMemory provider inside a per-test factory. This exercises the full
//  Minimal API + CQRS + repository pipeline end-to-end while remaining
//  Docker-less. Testcontainers-backed migrations coverage lives in
//  MigrationsAndSnakeCaseTests.
// -----------------------------------------------------------------------------
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests;

public class InMemoryDbWebApplicationFactory : WebApplicationFactory<Program>
{
    public string DatabaseName { get; } = $"clientes-tests-{Guid.NewGuid()}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Force a known environment so appsettings.Testing.json is loaded (with a
        // valid stub connection string for Program.cs startup validation).
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            // Strip every EF Core service registration so the Npgsql provider that
            // Program.cs wired up is completely removed. Otherwise EF refuses to
            // register a second provider inside the same service provider.
            var toRemove = services
                .Where(d =>
                    d.ServiceType == typeof(DbContextOptions<AppDbContext>) ||
                    d.ServiceType == typeof(DbContextOptions) ||
                    d.ServiceType == typeof(AppDbContext) ||
                    (d.ServiceType.FullName?.StartsWith("Microsoft.EntityFrameworkCore", StringComparison.Ordinal) ?? false) ||
                    (d.ServiceType.FullName?.StartsWith("Npgsql", StringComparison.Ordinal) ?? false))
                .ToList();

            foreach (var descriptor in toRemove)
            {
                services.Remove(descriptor);
            }

            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase(DatabaseName));
        });
    }
}

[Trait("Category", "Integration")]
public class ClienteEndpointsTests : IClassFixture<InMemoryDbWebApplicationFactory>
{
    private readonly InMemoryDbWebApplicationFactory _factory;

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public ClienteEndpointsTests(InMemoryDbWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private async Task ResetAndSeedAsync(params ClienteEntity[] clientes)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Clientes.RemoveRange(db.Clientes);
        if (clientes.Length > 0)
        {
            await db.Clientes.AddRangeAsync(clientes);
        }
        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task GetClientes_WhenEmpty_Returns200WithEmptyArray()
    {
        await ResetAndSeedAsync();
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/v1/clientes");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);

        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        Assert.Equal(0, doc.RootElement.GetArrayLength());
    }

    [Fact]
    public async Task GetClientes_WithSeededData_Returns200WithClienteDtoShape()
    {
        var acme = ClienteEntity.Create("Acme Corp", "900123456-7", "+57 300 111 1111", "Cali");
        var beta = ClienteEntity.Create("Beta Ltda", "800987654-3", "+57 301 222 2222", "Bogotá");
        var gamma = ClienteEntity.Create("Gamma Industrial", "901234567-8", "+57 302 333 3333", "Medellín");

        await ResetAndSeedAsync(acme, beta, gamma);
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/v1/clientes");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var dtos = await response.Content.ReadFromJsonAsync<List<ClienteDto>>(JsonOptions);
        Assert.NotNull(dtos);
        Assert.Equal(3, dtos!.Count);

        var acmeDto = dtos.Single(d => d.Nombre == "Acme Corp");
        Assert.Equal("900123456-7", acmeDto.Nit);
        Assert.Equal("+57 300 111 1111", acmeDto.Telefono);
        Assert.Equal("Cali", acmeDto.Ciudad);
        Assert.NotEqual(Guid.Empty, acmeDto.Id);
    }

    [Fact]
    public async Task GetClientes_ReturnsCamelCaseJsonKeys()
    {
        var cliente = ClienteEntity.Create("Delta", "900000000-1", "+57 000", "Cali");
        await ResetAndSeedAsync(cliente);
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/v1/clientes");
        var body = await response.Content.ReadAsStringAsync();

        // camelCase keys per Program.cs JsonOptions
        Assert.Contains("\"id\"", body);
        Assert.Contains("\"nombre\"", body);
        Assert.Contains("\"createdAt\"", body);
        Assert.Contains("\"updatedAt\"", body);
        // No PascalCase leaks
        Assert.DoesNotContain("\"Id\"", body);
        Assert.DoesNotContain("\"Nombre\"", body);
        Assert.DoesNotContain("\"CreatedAt\"", body);
    }

    [Fact]
    public async Task GetClientes_UnknownSubroute_DoesNotLeakStackTrace()
    {
        await ResetAndSeedAsync();
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/v1/clientes/not-a-valid-id-xyz");
        var body = await response.Content.ReadAsStringAsync();

        // NFR6 — no C# stack trace / EF Core internals / async state machine frames.
        Assert.DoesNotMatch(new System.Text.RegularExpressions.Regex(@"at [A-Za-z_.]+\+?<[A-Za-z_>]+>[a-z0-9_]+"), body);
        Assert.DoesNotContain("System.InvalidOperationException", body);
        Assert.DoesNotContain("Microsoft.EntityFrameworkCore", body);
        Assert.DoesNotContain(".cs:line", body);
    }
}
