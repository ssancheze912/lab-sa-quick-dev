using System.Diagnostics;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using SiesaAgents.Infrastructure.Data;
using Testcontainers.PostgreSql;

namespace SiesaAgents.IntegrationTests.Api;

/// <summary>
/// Story 2.1 — Client List & Search — Performance ATDD (NFR1, R3).
///
/// TC-E2-P0-04 (API leg): with 500 seeded clients, GET /api/v1/clientes?search=&lt;fragment&gt;
/// must hold p95 below 1000 ms across 20 iterations.
/// </summary>
public class ClientesSearchPerformanceTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:18")
        .WithDatabase("siesa_agents_db")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .Build();

    private WebApplicationFactory<Program>? _factory;
    private HttpClient? _client;

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();

        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    var descriptor = services.FirstOrDefault(d =>
                        d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                    if (descriptor is not null)
                    {
                        services.Remove(descriptor);
                    }
                    services.AddDbContext<AppDbContext>(options =>
                        options.UseNpgsql(_postgres.GetConnectionString()));
                });
            });

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await db.Database.MigrateAsync();
        }

        _client = _factory.CreateClient();

        await SeedFiveHundredClientesAsync();
    }

    public async Task DisposeAsync()
    {
        _client?.Dispose();
        if (_factory is not null) await _factory.DisposeAsync();
        await _postgres.DisposeAsync();
    }

    [Fact]
    public async Task GetClientesWithSearch_With500Rows_HoldsP95UnderOneSecond()
    {
        // GIVEN: 500 rows seeded and the API running
        var fragments = new[] { "ACME", "Distribuidora", "Beta", "Comercial", "Cliente" };
        var rng = new Random(42);

        var samples = new List<double>(20);

        // WHEN: 20 iterations of GET ?search=<random fragment>
        for (var i = 0; i < 20; i++)
        {
            var fragment = fragments[rng.Next(fragments.Length)];
            var sw = Stopwatch.StartNew();
            var response = await _client!.GetAsync($"/api/v1/clientes?search={fragment}");
            sw.Stop();

            response.EnsureSuccessStatusCode();
            samples.Add(sw.Elapsed.TotalMilliseconds);
        }

        // THEN: p95 (the 19th sorted sample of 20) must be < 1000ms (NFR1)
        samples.Sort();
        var p95 = samples[(int)Math.Ceiling(0.95 * samples.Count) - 1];
        p95.Should().BeLessThan(1000, "NFR1 requires p95 search latency < 1s at 500 records");
    }

    private async Task SeedFiveHundredClientesAsync()
    {
        await using var conn = new NpgsqlConnection(_postgres.GetConnectionString());
        await conn.OpenAsync();

        // Bulk insert via single COPY-like statement for speed
        await using var batch = new NpgsqlBatch(conn);
        for (var i = 0; i < 500; i++)
        {
            var prefix = (i % 5) switch
            {
                0 => "ACME",
                1 => "Distribuidora",
                2 => "Beta",
                3 => "Comercial",
                _ => "Cliente",
            };
            var cmd = new NpgsqlBatchCommand(
                @"INSERT INTO clientes (id, nombre, nit, telefono, ciudad, created_at, updated_at)
                  VALUES (@id, @nombre, @nit, @telefono, @ciudad, @created_at, @created_at);");
            cmd.Parameters.AddWithValue("id", Guid.NewGuid());
            cmd.Parameters.AddWithValue("nombre", $"{prefix} Cliente {i:D4}");
            cmd.Parameters.AddWithValue("nit", $"9{i:D9}");
            cmd.Parameters.AddWithValue("telefono", $"300{i:D7}");
            cmd.Parameters.AddWithValue("ciudad", "Bogotá");
            cmd.Parameters.AddWithValue("created_at", DateTimeOffset.UtcNow.AddSeconds(-i));
            batch.BatchCommands.Add(cmd);
        }
        await batch.ExecuteNonQueryAsync();
    }
}
