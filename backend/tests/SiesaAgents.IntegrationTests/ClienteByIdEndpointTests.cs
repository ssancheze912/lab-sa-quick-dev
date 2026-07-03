using System.Net;
using System.Net.Http.Headers;
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
/// Story 2.2 — TC-E2-P1-12 (RED phase).
///
/// Verifies <c>GET /api/v1/clientes/{id:guid}</c>:
///
/// 1. Returns HTTP 200 with a single JSON object (no envelope) for an
///    existing GUID; response has camelCase fields exactly
///    <c>id, nombre, nitRuc, telefono, ciudad, createdAt, updatedAt</c> and
///    timestamps are ISO-8601 with offset (DateTimeOffset serialisation).
/// 2. Returns HTTP 404 with <c>application/problem+json</c> body (RFC 7807)
///    for a well-formed GUID with no matching row. Body contains
///    <c>title</c>, <c>status: 404</c>, <c>type</c>, and <c>instance</c>.
///    Body does NOT include <c>stackTrace</c>, <c>Exception</c>, <c>Npgsql</c>,
///    or <c>DbUpdateException</c> (NFR6 — no internal leakage).
/// 3. Returns HTTP 404 for a non-GUID segment (route constraint <c>:guid</c>).
///
/// The Docker-availability probe mirrors Story 1.3 / 2.1 — when Docker is
/// unavailable in the sandbox, each test self-skips via
/// <see cref="SkippableFact"/> instead of crashing at container-builder
/// validation time.
///
/// RED-phase expectation: the endpoint <c>MapGet("/{id:guid}", ...)</c> is
/// not yet registered. All three tests will fail with an unexpected status
/// (or fail to compile if <see cref="ClienteEntity"/> is missing) until
/// Story 2.2 Tasks 1–4 are complete.
/// </summary>
public class ClienteByIdEndpointTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer? _postgres;
    private readonly bool _dockerAvailable;
    private WebApplicationFactory<Program>? _factory;

    public ClienteByIdEndpointTests()
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
    public async Task GetClienteById_returns_200_with_full_payload_for_existing_id()
    {
        Skip.IfNot(
            _dockerAvailable,
            "Docker daemon unavailable — TC-E2-P1-12 requires Testcontainers Postgres.");

        // GIVEN: A single cliente is seeded with a known id
        var knownId = Guid.NewGuid();
        using (var scope = _factory!.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Clientes.RemoveRange(db.Clientes);
            await db.SaveChangesAsync();

            db.Clientes.Add(new ClienteEntity
            {
                Id = knownId,
                Nombre = "Cliente Detalle",
                NitRuc = "900-501-001",
                Telefono = "3005555555",
                Ciudad = "Cartagena",
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow,
            });
            await db.SaveChangesAsync();
        }

        // WHEN: The client GETs /api/v1/clientes/{knownId}
        using var client = _factory!.CreateClient();
        var response = await client.GetAsync($"/api/v1/clientes/{knownId}");

        // THEN: 200 OK, single JSON object, all seven camelCase keys present,
        //       createdAt is ISO-8601 with offset.
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;
        Assert.Equal(JsonValueKind.Object, root.ValueKind);

        Assert.True(root.TryGetProperty("id", out var idProp));
        Assert.Equal(knownId, idProp.GetGuid());

        Assert.True(root.TryGetProperty("nombre", out var nombreProp));
        Assert.Equal("Cliente Detalle", nombreProp.GetString());

        Assert.True(root.TryGetProperty("nitRuc", out var nitProp));
        Assert.Equal("900-501-001", nitProp.GetString());

        Assert.True(root.TryGetProperty("telefono", out var telProp));
        Assert.Equal("3005555555", telProp.GetString());

        Assert.True(root.TryGetProperty("ciudad", out var ciudadProp));
        Assert.Equal("Cartagena", ciudadProp.GetString());

        Assert.True(root.TryGetProperty("createdAt", out var createdAtProp));
        Assert.True(root.TryGetProperty("updatedAt", out _));

        // No PascalCase leakage
        Assert.False(root.TryGetProperty("Id", out _));
        Assert.False(root.TryGetProperty("Nombre", out _));
        Assert.False(root.TryGetProperty("NitRuc", out _));

        // ISO-8601 + offset regex
        var createdAt = createdAtProp.GetString();
        Assert.NotNull(createdAt);
        var regex = new Regex(
            @"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?([+-]\d{2}:\d{2}|Z)$");
        Assert.Matches(regex, createdAt!);
    }

    [SkippableFact]
    public async Task GetClienteById_returns_404_ProblemDetails_for_missing_id()
    {
        Skip.IfNot(
            _dockerAvailable,
            "Docker daemon unavailable — TC-E2-P1-12 requires Testcontainers Postgres.");

        // GIVEN: The clientes table has no row with the zero GUID
        using (var scope = _factory!.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Clientes.RemoveRange(db.Clientes);
            await db.SaveChangesAsync();
        }

        // WHEN: The client GETs /api/v1/clientes/{zero-guid}
        var missingId = "00000000-0000-0000-0000-000000000000";
        using var client = _factory!.CreateClient();
        var response = await client.GetAsync($"/api/v1/clientes/{missingId}");

        // THEN: 404 Not Found + application/problem+json body per RFC 7807
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        var contentType = response.Content.Headers.ContentType;
        Assert.NotNull(contentType);
        Assert.StartsWith("application/problem+json", contentType!.MediaType);

        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("title", out var titleProp));
        Assert.Equal("Not Found", titleProp.GetString());

        Assert.True(root.TryGetProperty("status", out var statusProp));
        Assert.Equal(404, statusProp.GetInt32());

        Assert.True(root.TryGetProperty("type", out _));
        Assert.True(root.TryGetProperty("instance", out var instanceProp));
        Assert.Equal(
            $"/api/v1/clientes/{missingId}",
            instanceProp.GetString());

        // NFR6 — defense-in-depth: the raw response body MUST NOT contain
        // internal exception details.
        Assert.DoesNotContain("stackTrace", body);
        Assert.DoesNotContain("Exception", body);
        Assert.DoesNotContain("Npgsql", body);
        Assert.DoesNotContain("DbUpdateException", body);
    }

    [SkippableFact]
    public async Task GetClienteById_returns_404_when_segment_is_not_a_guid()
    {
        Skip.IfNot(
            _dockerAvailable,
            "Docker daemon unavailable — TC-E2-P1-12 requires Testcontainers Postgres.");

        // GIVEN: The endpoint is registered with a :guid route constraint;
        //        a non-GUID segment must short-circuit to a framework 404
        //        without ever invoking the handler.

        // WHEN: The client GETs /api/v1/clientes/{non-guid}
        using var client = _factory!.CreateClient();
        var response = await client.GetAsync("/api/v1/clientes/foo");

        // THEN: 404 Not Found (route constraint filter)
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
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
