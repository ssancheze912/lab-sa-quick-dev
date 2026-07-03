using System.Net;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Infrastructure.Data;
using Testcontainers.PostgreSql;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// Story 2.1 — TC-E2-P1-11 (RED phase).
///
/// Verifies that <c>GET /api/v1/clientes</c>:
/// 1. Returns HTTP 200 OK with a JSON array (no envelope).
/// 2. Serialises each item with camelCase fields exactly
///    <c>id, nombre, nitRuc, telefono, ciudad, createdAt, updatedAt</c>.
/// 3. Encodes <c>createdAt</c> / <c>updatedAt</c> as ISO-8601 with a timezone
///    offset — proof that <c>DateTimeOffset</c> serialisation is in effect
///    (NOT naive <c>DateTime</c>).
/// 4. Returns <c>[]</c> (not <c>null</c>) when the <c>clientes</c> table is
///    empty.
///
/// The Docker-availability probe follows Story 1.3's pattern
/// (<see cref="EfCoreMigrationTests"/>). When Docker is unavailable in the
/// sandbox, the test self-skips instead of crashing at container-builder
/// validation time.
///
/// RED-phase expectation: fails to compile until
///   • <see cref="ClienteEntity"/> exists (Task 1)
///   • <c>AppDbContext.Clientes</c> DbSet is registered (Task 2)
///   • the migration is generated (Task 3)
///   • <c>MapClienteEndpoints</c> is wired in <c>Program.cs</c> (Task 4)
/// </summary>
public class ClienteEndpointsTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer? _postgres;
    private readonly bool _dockerAvailable;
    private WebApplicationFactory<Program>? _factory;

    public ClienteEndpointsTests()
    {
        _dockerAvailable = IsDockerAvailable();

        _postgres = _dockerAvailable
            ? new PostgreSqlBuilder()
                .WithImage("postgres:18-alpine")
                .WithDatabase("siesa_agents_db_test")
                .WithUsername("postgres")
                .WithPassword("postgres")
                .Build()
            : null;
    }

    public async Task InitializeAsync()
    {
        if (_postgres is null) return;

        await _postgres.StartAsync();

        var connectionString = _postgres.GetConnectionString();

        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseSetting(
                    "ConnectionStrings:DefaultConnection",
                    connectionString);

                builder.ConfigureServices(services =>
                {
                    // Force AppDbContext to bind to the Testcontainers Postgres.
                    var descriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                    if (descriptor is not null)
                    {
                        services.Remove(descriptor);
                    }
                    services.AddDbContext<AppDbContext>(options =>
                        options.UseNpgsql(connectionString));
                });
            });

        // Apply migrations up-front so every test observes the schema.
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();
    }

    public async Task DisposeAsync()
    {
        _factory?.Dispose();
        if (_postgres is not null)
        {
            await _postgres.DisposeAsync();
        }
    }

    [SkippableFact]
    public async Task GetClientes_returns_200_with_empty_array_when_no_rows_exist()
    {
        Skip.IfNot(
            _dockerAvailable,
            "Docker daemon unavailable — TC-E2-P1-11 requires Testcontainers Postgres. Verify manually with `dotnet run` + curl.");

        // GIVEN: The clientes table is empty
        using (var scope = _factory!.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Clientes.RemoveRange(db.Clientes);
            await db.SaveChangesAsync();
        }

        // WHEN: The client GETs /api/v1/clientes
        using var client = _factory!.CreateClient();
        var response = await client.GetAsync("/api/v1/clientes");

        // THEN: 200 OK + literal "[]" JSON payload
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Equal("[]", body.Trim());
    }

    [SkippableFact]
    public async Task GetClientes_returns_200_with_camelCase_fields_when_rows_exist()
    {
        Skip.IfNot(
            _dockerAvailable,
            "Docker daemon unavailable — TC-E2-P1-11 requires Testcontainers Postgres.");

        // GIVEN: The clientes table has three seeded rows
        using (var scope = _factory!.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Clientes.RemoveRange(db.Clientes);
            await db.SaveChangesAsync();

            db.Clientes.AddRange(
                new ClienteEntity
                {
                    Id = Guid.NewGuid(),
                    Nombre = "Cliente Uno",
                    NitRuc = "900123456-1",
                    Telefono = "3001111111",
                    Ciudad = "Bogotá",
                    CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-2),
                    UpdatedAt = DateTimeOffset.UtcNow.AddMinutes(-2),
                },
                new ClienteEntity
                {
                    Id = Guid.NewGuid(),
                    Nombre = "Cliente Dos",
                    NitRuc = "900123456-2",
                    Telefono = "3002222222",
                    Ciudad = "Medellín",
                    CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-1),
                    UpdatedAt = DateTimeOffset.UtcNow.AddMinutes(-1),
                },
                new ClienteEntity
                {
                    Id = Guid.NewGuid(),
                    Nombre = "Cliente Tres",
                    NitRuc = "900123456-3",
                    Telefono = "3003333333",
                    Ciudad = "Cali",
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow,
                });
            await db.SaveChangesAsync();
        }

        // WHEN: The client GETs /api/v1/clientes
        using var client = _factory!.CreateClient();
        var response = await client.GetAsync("/api/v1/clientes");

        // THEN: 200 OK with a JSON array of 3 items with camelCase keys
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;
        Assert.Equal(JsonValueKind.Array, root.ValueKind);
        Assert.Equal(3, root.GetArrayLength());

        foreach (var item in root.EnumerateArray())
        {
            // Required camelCase keys are present
            Assert.True(item.TryGetProperty("id", out _));
            Assert.True(item.TryGetProperty("nombre", out _));
            Assert.True(item.TryGetProperty("nitRuc", out _));
            Assert.True(item.TryGetProperty("telefono", out _));
            Assert.True(item.TryGetProperty("ciudad", out _));
            Assert.True(item.TryGetProperty("createdAt", out _));
            Assert.True(item.TryGetProperty("updatedAt", out _));

            // No PascalCase leakage
            Assert.False(item.TryGetProperty("Id", out _));
            Assert.False(item.TryGetProperty("Nombre", out _));
            Assert.False(item.TryGetProperty("NitRuc", out _));
            Assert.False(item.TryGetProperty("CreatedAt", out _));
        }
    }

    [SkippableFact]
    public async Task GetClientes_serialises_createdAt_as_ISO8601_with_offset()
    {
        Skip.IfNot(
            _dockerAvailable,
            "Docker daemon unavailable — TC-E2-P1-11 requires Testcontainers Postgres.");

        // GIVEN: A single client seeded with a DateTimeOffset CreatedAt
        using (var scope = _factory!.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Clientes.RemoveRange(db.Clientes);
            await db.SaveChangesAsync();

            db.Clientes.Add(new ClienteEntity
            {
                Id = Guid.NewGuid(),
                Nombre = "Cliente Fecha",
                NitRuc = "900999999-1",
                Telefono = "3004444444",
                Ciudad = "Barranquilla",
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow,
            });
            await db.SaveChangesAsync();
        }

        // WHEN: The client GETs /api/v1/clientes
        using var client = _factory!.CreateClient();
        var response = await client.GetAsync("/api/v1/clientes");

        // THEN: createdAt matches the ISO-8601 + offset regex mandated by the story
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var createdAt = doc.RootElement[0].GetProperty("createdAt").GetString();
        Assert.NotNull(createdAt);
        var regex = new Regex(
            @"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?([+-]\d{2}:\d{2}|Z)$");
        Assert.Matches(regex, createdAt!);
    }

    private static bool IsDockerAvailable()
    {
        var socket = Environment.GetEnvironmentVariable("DOCKER_HOST");
        if (!string.IsNullOrWhiteSpace(socket))
        {
            return true;
        }
        return File.Exists("/var/run/docker.sock");
    }
}
