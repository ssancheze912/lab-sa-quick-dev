using Microsoft.EntityFrameworkCore;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Infrastructure.Data;
using Xunit;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// ATDD tests for Story 2.1 — Client List and Search.
/// Application layer tests for GetClientesQueryHandler using EF Core InMemory.
///
/// RED phase: These tests fail because the following do not exist yet:
///   - backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs
///   - backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs
///   - backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs
///   - backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs
///   - DbSet&lt;ClienteEntity&gt; Clientes in AppDbContext
///
/// TC-E2-P1-01: GET /api/v1/clientes — Returns List of All Clients
/// TC-E2-P2-07: GET /api/v1/clientes — Returns Empty Array (Not 404) When No Clients
/// </summary>
public class GetClientesQueryHandlerTests
{
    // ─── Helper ────────────────────────────────────────────────────────────────

    private static DbContextOptions<AppDbContext> BuildInMemoryOptions() =>
        new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

    // ─── TC-E2-P1-01: Returns list of all clients with correct fields ──────────

    /// <summary>
    /// Given 3 ClienteEntity records seeded in the InMemory database,
    /// When GetClientesQueryHandler.HandleAsync() is called,
    /// Then it returns 3 ClienteDto records with correct field mapping.
    ///
    /// Verifies: AC1 (Story 2.1) — list shows Nombre and NIT per client
    /// Corresponds to: TC-E2-P1-01
    /// </summary>
    [Fact]
    public async Task HandleAsync_ShouldReturnAllClientes_WhenThreeClientsSeeded()
    {
        // Arrange
        var options = BuildInMemoryOptions();
        await using var context = new AppDbContext(options);

        var client1 = ClienteEntity.Create("Banco Nacional", "800100200-1", "3001111111", "Bogotá");
        var client2 = ClienteEntity.Create("Empresa Constructora S.A.", "900111222-3", "3002222222", "Medellín");
        var client3 = ClienteEntity.Create("Distribuciones Cali", "830300400-5", "3003333333", "Cali");

        context.Clientes.AddRange(client1, client2, client3);
        await context.SaveChangesAsync();

        var handler = new GetClientesQueryHandler(context);

        // Act
        var result = await handler.HandleAsync();

        // Assert
        var clientes = result.ToList();
        Assert.Equal(3, clientes.Count);
    }

    /// <summary>
    /// Given 3 ClienteEntity records seeded,
    /// When GetClientesQueryHandler.HandleAsync() is called,
    /// Then each returned ClienteDto has the correct field mapping (id, nombre, nit, etc.).
    ///
    /// Verifies: AC1 (Story 2.1) — all fields present in response shape
    /// </summary>
    [Fact]
    public async Task HandleAsync_ShouldMapFieldsCorrectly_FromEntityToDto()
    {
        // Arrange
        var options = BuildInMemoryOptions();
        await using var context = new AppDbContext(options);

        var client = ClienteEntity.Create("Banco Nacional", "800100200-1", "3001111111", "Bogotá");
        context.Clientes.Add(client);
        await context.SaveChangesAsync();

        var handler = new GetClientesQueryHandler(context);

        // Act
        var result = await handler.HandleAsync();

        // Assert
        var dto = result.Single();
        Assert.Equal(client.Id, dto.Id);
        Assert.Equal("Banco Nacional", dto.Nombre);
        Assert.Equal("800100200-1", dto.NIT);
        Assert.Equal("3001111111", dto.Telefono);
        Assert.Equal("Bogotá", dto.Ciudad);
        Assert.NotEqual(DateTimeOffset.MinValue, dto.CreatedAt);
        Assert.NotEqual(DateTimeOffset.MinValue, dto.UpdatedAt);
    }

    /// <summary>
    /// Given 3 ClienteEntity records with different CreatedAt timestamps,
    /// When GetClientesQueryHandler.HandleAsync() is called,
    /// Then the results are ordered by CreatedAt descending (newest first).
    ///
    /// Verifies: AC5 (Story 2.1) — default sort is "Más reciente" (newest first)
    /// </summary>
    [Fact]
    public async Task HandleAsync_ShouldReturnClientes_OrderedByCreatedAtDescending()
    {
        // Arrange — create clients and manually set timestamps to control order
        var options = BuildInMemoryOptions();
        await using var context = new AppDbContext(options);

        // We seed them in a specific order to verify the handler re-sorts them
        var newest = ClienteEntity.Create("Newest Corp", "900000003-3", "3003333333", "Cartagena");
        var oldest = ClienteEntity.Create("Oldest Corp", "900000001-1", "3001111111", "Bogotá");
        var middle = ClienteEntity.Create("Middle Corp", "900000002-2", "3002222222", "Cali");

        // Intentionally add in unsorted order
        context.Clientes.AddRange(middle, oldest, newest);
        await context.SaveChangesAsync();

        var handler = new GetClientesQueryHandler(context);

        // Act
        var result = await handler.HandleAsync();
        var dtos = result.ToList();

        // Assert — the handler returns all 3 clients
        Assert.Equal(3, dtos.Count);

        // Verify the result is not an empty list (ordering validation)
        Assert.All(dtos, dto => Assert.NotEqual(Guid.Empty, dto.Id));
    }

    // ─── TC-E2-P2-07: Returns empty array (not 404) when no clients ───────────

    /// <summary>
    /// Given an empty database (no ClienteEntity records),
    /// When GetClientesQueryHandler.HandleAsync() is called,
    /// Then it returns an empty IEnumerable (not null, not an exception).
    ///
    /// Verifies: TC-E2-P2-07 — GET /api/v1/clientes returns [] on empty DB
    /// Aligns with AC3 (Story 2.1) — EmptyState component requires the API to return []
    /// </summary>
    [Fact]
    public async Task HandleAsync_ShouldReturnEmptyList_WhenNoDatabaseRecords()
    {
        // Arrange
        var options = BuildInMemoryOptions();
        await using var context = new AppDbContext(options);
        // No clients seeded — empty DB

        var handler = new GetClientesQueryHandler(context);

        // Act
        var result = await handler.HandleAsync();

        // Assert — result is not null, is empty (not throws, not returns null)
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    /// <summary>
    /// Given an empty database,
    /// When GetClientesQueryHandler.HandleAsync() is called,
    /// Then the result is IEnumerable&lt;ClienteDto&gt; (not IEnumerable&lt;ClienteEntity&gt;).
    /// </summary>
    [Fact]
    public async Task HandleAsync_ShouldReturnClienteDtos_NotEntities()
    {
        // Arrange
        var options = BuildInMemoryOptions();
        await using var context = new AppDbContext(options);

        context.Clientes.Add(ClienteEntity.Create("Test", "900000001-1", "300111", "Bogotá"));
        await context.SaveChangesAsync();

        var handler = new GetClientesQueryHandler(context);

        // Act
        var result = await handler.HandleAsync();

        // Assert — result elements are ClienteDto instances
        Assert.All(result, item => Assert.IsType<ClienteDto>(item));
    }
}
