using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// Story 2.1 — <c>GET /api/v1/clientes</c> HTTP contract tests.
///
/// Uses <see cref="WebApplicationFactory{TEntryPoint}"/> against a dedicated PostgreSQL DB.
/// Reads the same appsettings connection strings but points them at
/// <c>siesa_agents_db_endpoint_test</c> to keep state isolated from other test classes.
/// </summary>
public class ClienteEndpointsTests : IAsyncLifetime, IClassFixture<ClienteEndpointsAppFactory>
{
    private const string AdminConnectionString =
        "Host=localhost;Port=5432;Database=postgres;Username=postgres;Password=postgres";

    private readonly ClienteEndpointsAppFactory _factory;
    private bool _postgresAvailable;

    public ClienteEndpointsTests(ClienteEndpointsAppFactory factory)
    {
        _factory = factory;
    }

    public async ValueTask InitializeAsync()
    {
        _postgresAvailable = await IsPostgresReachableAsync();
        if (!_postgresAvailable) return;

        await using var adminConn = new NpgsqlConnection(AdminConnectionString);
        await adminConn.OpenAsync();

        await using (var drop = new NpgsqlCommand(
            "DROP DATABASE IF EXISTS siesa_agents_db_endpoint_test WITH (FORCE);", adminConn))
        {
            await drop.ExecuteNonQueryAsync();
        }
        await using (var create = new NpgsqlCommand(
            "CREATE DATABASE siesa_agents_db_endpoint_test;", adminConn))
        {
            await create.ExecuteNonQueryAsync();
        }

        // Apply migrations.
        using var scope = _factory.Services.CreateScope();
        var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await ctx.Database.MigrateAsync();
    }

    public ValueTask DisposeAsync() => ValueTask.CompletedTask;

    // -------------------------------------------------------------------------
    // AC #7 — Response contract
    // -------------------------------------------------------------------------

    [Fact(DisplayName = "[P0] AC#7 — GET /api/v1/clientes returns 200 with empty JSON array when no clientes")]
    public async Task GetClientes_ReturnsEmptyArray_WhenNoClientes()
    {
        SkipIfPostgresUnavailable();

        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/v1/clientes");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Equal("[]", body.Trim());
    }

    [Fact(DisplayName = "[P0] AC#7 — GET /api/v1/clientes returns items ordered by createdAt DESC")]
    public async Task GetClientes_ReturnsClientes_OrderedByCreatedAtDesc()
    {
        SkipIfPostgresUnavailable();

        using (var seedScope = _factory.Services.CreateScope())
        {
            var ctx = seedScope.ServiceProvider.GetRequiredService<AppDbContext>();
            // Clear + reseed to make the test independent from previous cases.
            ctx.Clientes.RemoveRange(ctx.Clientes);
            await ctx.SaveChangesAsync();

            var oldest = ClienteEntity.Create("Oldest Corp", "100000001", "3001", "Bogotá");
            var middle = ClienteEntity.Create("Middle Corp", "100000002", "3002", "Medellín");
            var newest = ClienteEntity.Create("Newest Corp", "100000003", "3003", "Cali");

            // Ensure distinct CreatedAt.
            var basis = DateTimeOffset.UtcNow;
            typeof(ClienteEntity).GetProperty(nameof(ClienteEntity.CreatedAt))!
                .SetValue(oldest, basis.AddSeconds(-10));
            typeof(ClienteEntity).GetProperty(nameof(ClienteEntity.CreatedAt))!
                .SetValue(middle, basis.AddSeconds(-5));
            typeof(ClienteEntity).GetProperty(nameof(ClienteEntity.CreatedAt))!
                .SetValue(newest, basis);

            ctx.Clientes.AddRange(oldest, middle, newest);
            await ctx.SaveChangesAsync();
        }

        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/v1/clientes");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);

        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        var names = doc.RootElement.EnumerateArray()
            .Select(e => e.GetProperty("nombre").GetString())
            .ToList();

        Assert.Equal(new[] { "Newest Corp", "Middle Corp", "Oldest Corp" }, names);
    }

    [Fact(DisplayName = "[P0] AC#7 — response uses camelCase keys and no snake_case leakage")]
    public async Task GetClientes_ReturnsCamelCaseJson()
    {
        SkipIfPostgresUnavailable();

        using (var seedScope = _factory.Services.CreateScope())
        {
            var ctx = seedScope.ServiceProvider.GetRequiredService<AppDbContext>();
            ctx.Clientes.RemoveRange(ctx.Clientes);
            await ctx.SaveChangesAsync();
            ctx.Clientes.Add(ClienteEntity.Create("Camel Corp", "900555777", "3009999999", "Bogotá"));
            await ctx.SaveChangesAsync();
        }

        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/v1/clientes");
        var body = await response.Content.ReadAsStringAsync();

        Assert.Contains("\"nombre\"", body);
        Assert.Contains("\"nit\"", body);
        Assert.Contains("\"createdAt\"", body);
        Assert.Contains("\"updatedAt\"", body);
        // Anti-shape: no snake_case leakage.
        Assert.DoesNotContain("created_at", body);
        Assert.DoesNotContain("updated_at", body);
    }

    [Fact(DisplayName = "[P1] AC#7 — response body is a direct array (no envelope)")]
    public async Task GetClientes_ReturnsDirectArray_NotWrappedInEnvelope()
    {
        SkipIfPostgresUnavailable();

        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/v1/clientes");
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);

        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
    }

    private static async Task<bool> IsPostgresReachableAsync()
    {
        try
        {
            await using var conn = new NpgsqlConnection(AdminConnectionString);
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(3));
            await conn.OpenAsync(cts.Token);
            return conn.State == System.Data.ConnectionState.Open;
        }
        catch
        {
            return false;
        }
    }

    private void SkipIfPostgresUnavailable()
    {
        Assert.SkipUnless(_postgresAvailable,
            "PostgreSQL not reachable at localhost:5432 (postgres/postgres). " +
            "Start it with: docker run --name siesa-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:18-alpine");
    }
}

/// <summary>
/// Test host wiring for Story 2.1 endpoint tests. Overrides the DbContext registration to
/// point at the dedicated <c>siesa_agents_db_endpoint_test</c> database.
/// </summary>
public class ClienteEndpointsAppFactory : WebApplicationFactory<Program>
{
    private const string EndpointTestConnectionString =
        "Host=localhost;Port=5432;Database=siesa_agents_db_endpoint_test;Username=postgres;Password=postgres";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Test");
        builder.ConfigureServices(services =>
        {
            var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
            if (descriptor is not null) services.Remove(descriptor);

            services.AddDbContext<AppDbContext>(options =>
                options.UseNpgsql(EndpointTestConnectionString,
                            npgsql => npgsql.MigrationsHistoryTable(AppDbContext.MigrationsHistoryTableName))
                       .UseSnakeCaseNamingConvention());
        });
    }
}
