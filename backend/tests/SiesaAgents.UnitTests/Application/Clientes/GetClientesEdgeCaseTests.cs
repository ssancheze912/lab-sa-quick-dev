using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Edge case tests for GET /api/v1/clientes — Story 2.1 Automate Expansion.
///
/// Covers boundary conditions not present in the ATDD GetClientesTests:
///   - Content-Type response header is application/json
///   - createdAt field is a valid DateTimeOffset (not DateTime)
///   - Large list (10 records) returns all items
///   - ClienteEntity.Create() assigns a non-empty Guid Id
///   - ClienteEntity.Create() assigns DateTimeOffset (not default DateTime)
///   - updatedAt field is NOT exposed in the API response (privacy boundary)
/// </summary>
public class GetClientesEdgeCaseTests
{
    // -------------------------------------------------------------------------
    // Content-Type header
    // -------------------------------------------------------------------------
    [Fact]
    public async Task GetClientes_ResponseHeader_IsApplicationJson()
    {
        // Arrange
        await using var factory = new ClientesTestFactory();
        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/v1/clientes");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(response.Content.Headers.ContentType);
        Assert.Equal("application/json", response.Content.Headers.ContentType.MediaType);
    }

    // -------------------------------------------------------------------------
    // createdAt is valid ISO 8601 / DateTimeOffset
    // -------------------------------------------------------------------------
    [Fact]
    public async Task GetClientes_CreatedAt_IsValidIso8601DateString()
    {
        // Arrange
        await using var factory = new ClientesTestFactory();

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Clientes.Add(ClienteEntity.Create("DateOffset Test SA", "900777001", "3001777001", "Bogotá"));
            await db.SaveChangesAsync();
        }

        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/v1/clientes");
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var first = doc.RootElement.EnumerateArray().First();

        // Assert: createdAt field is present
        Assert.True(first.TryGetProperty("createdAt", out var createdAtProp), "Missing 'createdAt' field");

        // createdAt must be parseable as a valid DateTimeOffset
        var createdAtString = createdAtProp.GetString();
        Assert.NotNull(createdAtString);
        var parsed = DateTimeOffset.Parse(createdAtString!);
        Assert.NotEqual(default, parsed);
    }

    // -------------------------------------------------------------------------
    // Large list: 10 records all returned
    // -------------------------------------------------------------------------
    [Fact]
    public async Task GetClientes_LargeList_ReturnsAllRecords()
    {
        // Arrange
        await using var factory = new ClientesTestFactory();

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            for (int i = 1; i <= 10; i++)
            {
                db.Clientes.Add(ClienteEntity.Create(
                    $"Bulk Empresa {i:D3}",
                    $"900{i:D6}",
                    $"300{i:D7}",
                    "Bogotá"));
            }

            await db.SaveChangesAsync();
        }

        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/v1/clientes");

        // Assert: all 10 records returned
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        Assert.Equal(10, doc.RootElement.GetArrayLength());
    }

    // -------------------------------------------------------------------------
    // updatedAt is NOT exposed in the response (privacy boundary)
    // -------------------------------------------------------------------------
    [Fact]
    public async Task GetClientes_ResponseDto_DoesNotExposeUpdatedAt()
    {
        // Arrange
        await using var factory = new ClientesTestFactory();

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Clientes.Add(ClienteEntity.Create("Privacy Test Co", "900555001", "3001555001", "Medellín"));
            await db.SaveChangesAsync();
        }

        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/v1/clientes");
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var first = doc.RootElement.EnumerateArray().First();

        // Assert: updatedAt must NOT be exposed (it's an internal domain field)
        Assert.False(first.TryGetProperty("updatedAt", out _), "'updatedAt' must not be in ClienteDto");
        Assert.False(first.TryGetProperty("updated_at", out _), "'updated_at' must not be in ClienteDto");
    }

    // -------------------------------------------------------------------------
    // ClienteEntity.Create() assigns a non-empty Guid
    // -------------------------------------------------------------------------
    [Fact]
    public void ClienteEntity_Create_AssignsNonEmptyGuidId()
    {
        // Act
        var entity = ClienteEntity.Create("Test SA", "900000001", "3000000001", "Bogotá");

        // Assert
        Assert.NotEqual(Guid.Empty, entity.Id);
    }

    // -------------------------------------------------------------------------
    // ClienteEntity.Create() assigns DateTimeOffset (not default DateTime)
    // -------------------------------------------------------------------------
    [Fact]
    public void ClienteEntity_Create_AssignsDateTimeOffsetNotDefault()
    {
        // Act
        var before = DateTimeOffset.UtcNow;
        var entity = ClienteEntity.Create("DTO Test SA", "900000002", "3000000002", "Cali");
        var after = DateTimeOffset.UtcNow;

        // Assert: CreatedAt and UpdatedAt are within the test window
        Assert.True(entity.CreatedAt >= before, "CreatedAt should be >= before");
        Assert.True(entity.CreatedAt <= after, "CreatedAt should be <= after");
        Assert.True(entity.UpdatedAt >= before, "UpdatedAt should be >= before");
        Assert.True(entity.UpdatedAt <= after, "UpdatedAt should be <= after");

        // Confirm they are NOT the default DateTimeOffset value
        Assert.NotEqual(default, entity.CreatedAt);
        Assert.NotEqual(default, entity.UpdatedAt);
    }

    // -------------------------------------------------------------------------
    // Two distinct ClienteEntity.Create() calls produce different Guids
    // -------------------------------------------------------------------------
    [Fact]
    public void ClienteEntity_Create_ProducesUniqueIds()
    {
        // Act
        var entity1 = ClienteEntity.Create("Entity One SA", "900000003", "3000000003", "Bogotá");
        var entity2 = ClienteEntity.Create("Entity Two Ltda", "900000004", "3000000004", "Cali");

        // Assert: IDs must be distinct (no shared static state)
        Assert.NotEqual(entity1.Id, entity2.Id);
    }
}
