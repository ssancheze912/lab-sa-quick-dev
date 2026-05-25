/**
 * Story 2.1: Client List &amp; Search
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (Application Unit Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   TC-E2-P1-02 — GetClientesQueryHandler returns all seeded clients as ClienteDto list
 *   AC1 — Handler returns correct fields: id, nombre, nit, telefono, ciudad, createdAt, updatedAt
 *
 * RED phase: These tests fail because:
 *   1. GetClientesQuery.cs does not exist at
 *      backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs
 *   2. GetClientesQueryHandler.cs does not exist at
 *      backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs
 *   3. ClienteDto.cs does not exist at
 *      backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs
 *   4. IClienteRepository.cs does not exist in Domain project
 *   5. Namespace SiesaAgents.Application.Clientes.* does not exist yet
 */

using Microsoft.EntityFrameworkCore;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// &lt;summary&gt;
/// Unit tests for GetClientesQueryHandler (Story 2.1, Tasks 9 &amp; 10).
/// Uses EF Core InMemory provider — no external dependencies.
/// Implements TC-E2-P1-02: handler returns all seeded clients as ClienteDto list.
/// &lt;/summary&gt;
public class GetClientesQueryHandlerTests : IDisposable
{
    private readonly AppDbContext _context;

    public GetClientesQueryHandlerTests()
    {
        var options = new DbContextOptionsBuilder&lt;AppDbContext&gt;()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new AppDbContext(options);
        _context.Database.EnsureCreated();
    }

    public void Dispose()
    {
        _context.Dispose();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-P1-02: Handler returns all seeded clients as ClienteDto list
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_ReturnsAllClients_WhenMultipleExist()
    {
        // Given: 5 clients seeded in the test database
        // When: GetClientesQuery is handled
        // Then: Handler returns all 5 clients as ClienteDto

        // Arrange — seed 5 clients using the ClienteEntity factory
        var seeded = new[]
        {
            ClienteEntity.Create("ACME S.A.", "900100001-1", "6014567890", "Bogotá"),
            ClienteEntity.Create("Beta Corp", "900200002-2", "3002222222", "Medellín"),
            ClienteEntity.Create("Gamma Ltd", "900300003-3", "3103333333", "Cali"),
            ClienteEntity.Create("Delta Inc", "900400004-4", "3204444444", "Barranquilla"),
            ClienteEntity.Create("Epsilon S.A.S.", "900500005-5", "3055555555", "Cartagena"),
        };

        _context.Clientes.AddRange(seeded);
        await _context.SaveChangesAsync();

        var repository = new InMemoryClienteRepository(_context);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery());
        var dtos = result.ToList();

        // Assert
        Assert.Equal(5, dtos.Count);
    }

    [Fact]
    public async Task HandleAsync_ReturnsEmptyList_WhenNoClientsExist()
    {
        // Given: No clients in the database
        // When: GetClientesQuery is handled
        // Then: Handler returns an empty list (not null)

        // Arrange
        var repository = new InMemoryClienteRepository(_context);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery());

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    [Fact]
    public async Task HandleAsync_MapsNombreCorrectly_ToClienteDto()
    {
        // Given: A client with a known Nombre
        // When: GetClientesQuery is handled
        // Then: The ClienteDto has the correct Nombre

        // Arrange
        var cliente = ClienteEntity.Create("ACME S.A.", "900123456-1", "6014567890", "Bogotá");
        _context.Clientes.Add(cliente);
        await _context.SaveChangesAsync();

        var repository = new InMemoryClienteRepository(_context);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery());
        var dto = result.Single();

        // Assert
        Assert.Equal("ACME S.A.", dto.Nombre);
    }

    [Fact]
    public async Task HandleAsync_MapsNitCorrectly_ToClienteDto()
    {
        // Given: A client with a known NIT
        // When: GetClientesQuery is handled
        // Then: The ClienteDto has the correct Nit

        // Arrange
        var cliente = ClienteEntity.Create("ACME S.A.", "900123456-1", "6014567890", "Bogotá");
        _context.Clientes.Add(cliente);
        await _context.SaveChangesAsync();

        var repository = new InMemoryClienteRepository(_context);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery());
        var dto = result.Single();

        // Assert
        Assert.Equal("900123456-1", dto.Nit);
    }

    [Fact]
    public async Task HandleAsync_MapsAllFieldsCorrectly_ToClienteDto()
    {
        // Given: A fully populated client entity
        // When: GetClientesQuery is handled
        // Then: The ClienteDto contains id, nombre, nit, telefono, ciudad, createdAt, updatedAt

        // Arrange
        var cliente = ClienteEntity.Create("ACME S.A.", "900123456-1", "6014567890", "Bogotá");
        _context.Clientes.Add(cliente);
        await _context.SaveChangesAsync();

        var repository = new InMemoryClienteRepository(_context);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery());
        var dto = result.Single();

        // Assert — verify all DTO fields are populated
        Assert.NotEqual(Guid.Empty, dto.Id);
        Assert.Equal("ACME S.A.", dto.Nombre);
        Assert.Equal("900123456-1", dto.Nit);
        Assert.Equal("6014567890", dto.Telefono);
        Assert.Equal("Bogotá", dto.Ciudad);
        Assert.NotEqual(default(DateTimeOffset), dto.CreatedAt);
        Assert.NotEqual(default(DateTimeOffset), dto.UpdatedAt);
    }

    [Fact]
    public async Task HandleAsync_DtoIdMatchesEntityId()
    {
        // Given: A client entity with a known Id
        // When: GetClientesQuery is handled
        // Then: The ClienteDto.Id matches the entity Id

        // Arrange
        var cliente = ClienteEntity.Create("ACME S.A.", "900123456-1", "6014567890", "Bogotá");
        _context.Clientes.Add(cliente);
        await _context.SaveChangesAsync();

        var repository = new InMemoryClienteRepository(_context);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery());
        var dto = result.Single();

        // Assert
        Assert.Equal(cliente.Id, dto.Id);
    }

    [Fact]
    public async Task HandleAsync_ReturnsDtosWithDateTimeOffsetTimestamps()
    {
        // Given: A client entity with DateTimeOffset timestamps
        // When: GetClientesQuery is handled
        // Then: The ClienteDto.CreatedAt and UpdatedAt are DateTimeOffset (not DateTime)
        //
        // This test enforces the company critical rule: NEVER use DateTime — only DateTimeOffset.

        // Arrange
        var cliente = ClienteEntity.Create("ACME S.A.", "900123456-1", "6014567890", "Bogotá");
        _context.Clientes.Add(cliente);
        await _context.SaveChangesAsync();

        var repository = new InMemoryClienteRepository(_context);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery());
        var dto = result.Single();

        // Assert — compile-time type check: ClienteDto.CreatedAt must be DateTimeOffset
        Assert.IsType&lt;DateTimeOffset&gt;(dto.CreatedAt);
        Assert.IsType&lt;DateTimeOffset&gt;(dto.UpdatedAt);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// InMemory repository adapter for unit tests
// Uses EF Core InMemory context to avoid real database dependency.
// This is a test double — NOT the production ClienteRepository.
// ─────────────────────────────────────────────────────────────────────────────

/// &lt;summary&gt;
/// Test double: IClienteRepository backed by EF Core InMemory context.
/// Used only in unit tests to isolate the query handler from infrastructure.
/// &lt;/summary&gt;
internal sealed class InMemoryClienteRepository : IClienteRepository
{
    private readonly AppDbContext _context;

    public InMemoryClienteRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task&lt;IEnumerable&lt;ClienteEntity&gt;&gt; GetAllAsync()
    {
        return await _context.Clientes
            .OrderByDescending(c =&gt; c.CreatedAt)
            .ToListAsync();
    }

    public async Task&lt;ClienteEntity?&gt; GetByIdAsync(Guid id)
    {
        return await _context.Clientes.FindAsync(id);
    }
}
