// Story 2.1: Client List & Search
// Epic 2: Client Management
//
// ATDD Acceptance Tests — RED Phase (Application — handler unit tests)
// These tests are intentionally FAILING until:
//   1. SiesaAgents.Domain.Entities.ClienteEntity exists,
//   2. SiesaAgents.Application.Clientes.Queries.GetClientesQueryHandler exists,
//   3. AppDbContext exposes DbSet<ClienteEntity> Clientes,
//   4. The Application project references EF Core (Microsoft.EntityFrameworkCore + EF Core InMemory in the test project).
//
// Acceptance Criteria covered:
//   AC #2 — GET /api/v1/clientes returns the full list as a JSON array.
//   AC #12 — Backend handler coverage (default OrderByDescending(CreatedAt) for Story 2.6 alignment).
//
// Test Design references:
//   Reads via DbContext.AsNoTracking() projected to ClienteDto (CQRS-lite per architecture.md).
//
// Strategy: Use Microsoft.EntityFrameworkCore.InMemory to seed an AppDbContext per
// test, invoke the handler, and assert ordering + projection.

using Microsoft.EntityFrameworkCore;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Entities;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Application.Clientes;

public class GetClientesQueryHandlerTests
{
    private static AppDbContext BuildContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"clientes-tests-{Guid.NewGuid():N}")
            .Options;
        return new AppDbContext(options);
    }

    private static ClienteEntity SeedEntity(string nombre, string nit, DateTimeOffset createdAt)
    {
        var entity = ClienteEntity.Create(nombre, nit, "3001234567", "Bogotá");
        typeof(ClienteEntity)
            .GetProperty(nameof(ClienteEntity.CreatedAt))!
            .SetValue(entity, createdAt);
        typeof(ClienteEntity)
            .GetProperty(nameof(ClienteEntity.UpdatedAt))!
            .SetValue(entity, createdAt);
        return entity;
    }

    [Fact]
    public async Task HandleAsync_WithEmptyDbSet_ReturnsEmptyList()
    {
        // GIVEN: A handler bound to an empty in-memory context
        using var ctx = BuildContext();
        var handler = new GetClientesQueryHandler(ctx);

        // WHEN: The handler is invoked
        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);

        // THEN: The response is an empty list (no nulls)
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    [Fact]
    public async Task HandleAsync_WithThreeClientes_ReturnsAllOrderedByCreatedAtDescending()
    {
        // GIVEN: Three clients with distinct CreatedAt timestamps
        using var ctx = BuildContext();
        var older = SeedEntity("Cliente Antiguo", "111111111-1", DateTimeOffset.UtcNow.AddDays(-10));
        var middle = SeedEntity("Cliente Intermedio", "222222222-2", DateTimeOffset.UtcNow.AddDays(-5));
        var newer = SeedEntity("Cliente Reciente", "333333333-3", DateTimeOffset.UtcNow.AddDays(-1));
        ctx.Clientes.AddRange(older, middle, newer);
        await ctx.SaveChangesAsync();

        var handler = new GetClientesQueryHandler(ctx);

        // WHEN: The handler is invoked
        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);

        // THEN: Three items are returned in descending order by CreatedAt (newest first)
        Assert.Equal(3, result.Count);
        Assert.Equal("Cliente Reciente", result[0].Nombre);
        Assert.Equal("Cliente Intermedio", result[1].Nombre);
        Assert.Equal("Cliente Antiguo", result[2].Nombre);
    }

    [Fact]
    public async Task HandleAsync_ProjectsAllSevenFieldsOfClienteDto()
    {
        // GIVEN: A single client persisted
        using var ctx = BuildContext();
        var entity = SeedEntity("Empresa Demo", "900111222-3", DateTimeOffset.UtcNow);
        ctx.Clientes.Add(entity);
        await ctx.SaveChangesAsync();

        var handler = new GetClientesQueryHandler(ctx);

        // WHEN: The handler is invoked
        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);

        // THEN: All seven projected fields match the entity (id, nombre, nit, telefono, ciudad, createdAt, updatedAt)
        var dto = Assert.Single(result);
        Assert.Equal(entity.Id, dto.Id);
        Assert.Equal("Empresa Demo", dto.Nombre);
        Assert.Equal("900111222-3", dto.Nit);
        Assert.Equal("3001234567", dto.Telefono);
        Assert.Equal("Bogotá", dto.Ciudad);
        Assert.Equal(entity.CreatedAt, dto.CreatedAt);
        Assert.Equal(entity.UpdatedAt, dto.UpdatedAt);
    }
}
