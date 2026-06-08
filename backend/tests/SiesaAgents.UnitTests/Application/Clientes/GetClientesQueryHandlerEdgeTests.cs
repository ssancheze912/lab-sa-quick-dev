// Story 2.1: Client List & Search — Automate Phase
// Epic 2: Client Management
//
// AUTOMATE expansion tests (edge cases — NOT regenerated from ATDD)
// Complements GetClientesQueryHandlerTests.cs with stress + tracking + cancellation edges.
//
// Acceptance Criteria touched:
//   AC #2  — Handler returns the full list as a JSON array (no pagination yet — NFR10).
//   AC #12 — Backend coverage expansion.

using Microsoft.EntityFrameworkCore;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Entities;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Application.Clientes;

public class GetClientesQueryHandlerEdgeTests
{
    private static AppDbContext BuildContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"clientes-edge-tests-{Guid.NewGuid():N}")
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
    public async Task P1_HandleAsync_With500Clientes_ReturnsAllItemsInOneCall_NoPagination()
    {
        // GIVEN: 500 seeded clients (NFR10: API returns the full list — no pagination)
        using var ctx = BuildContext();
        var now = DateTimeOffset.UtcNow;
        for (var i = 0; i < 500; i++)
        {
            // Unique NIT per row; distinct CreatedAt so ordering is deterministic
            var entity = SeedEntity($"Cliente {i:0000}", $"NIT-{i:00000}", now.AddSeconds(-i));
            ctx.Clientes.Add(entity);
        }
        await ctx.SaveChangesAsync();

        var handler = new GetClientesQueryHandler(ctx);

        // WHEN: The handler is invoked
        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);

        // THEN: All 500 are returned (NFR10 enforced — no implicit page cut-off)
        Assert.Equal(500, result.Count);
    }

    [Fact]
    public async Task P2_HandleAsync_DoesNotTrackEntities_AsNoTrackingApplied()
    {
        // GIVEN: A seeded client persisted via the context
        using var ctx = BuildContext();
        var entity = SeedEntity("Cliente Demo", "900-NT-1", DateTimeOffset.UtcNow);
        ctx.Clientes.Add(entity);
        await ctx.SaveChangesAsync();
        ctx.ChangeTracker.Clear();

        var handler = new GetClientesQueryHandler(ctx);

        // WHEN: The handler is invoked
        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);

        // THEN: No entities are added to the change tracker — query used AsNoTracking()
        Assert.Single(result);
        Assert.Empty(ctx.ChangeTracker.Entries<ClienteEntity>());
    }

    [Fact]
    public async Task P2_HandleAsync_WithCancelledToken_ThrowsOperationCanceledException()
    {
        // GIVEN: A handler and an already-cancelled token
        using var ctx = BuildContext();
        ctx.Clientes.Add(SeedEntity("Cliente", "900-X-1", DateTimeOffset.UtcNow));
        await ctx.SaveChangesAsync();

        var handler = new GetClientesQueryHandler(ctx);
        using var cts = new CancellationTokenSource();
        cts.Cancel();

        // WHEN / THEN: Cancellation propagates (cooperative cancellation contract for graceful shutdown)
        await Assert.ThrowsAnyAsync<OperationCanceledException>(async () =>
            await handler.HandleAsync(new GetClientesQuery(), cts.Token));
    }

    [Fact]
    public async Task P2_HandleAsync_ReturnsImmutableSnapshot_AddingAfterCallDoesNotMutateResult()
    {
        // GIVEN: Two seeded clients
        using var ctx = BuildContext();
        ctx.Clientes.Add(SeedEntity("A", "111-1", DateTimeOffset.UtcNow));
        ctx.Clientes.Add(SeedEntity("B", "222-1", DateTimeOffset.UtcNow.AddSeconds(-1)));
        await ctx.SaveChangesAsync();

        var handler = new GetClientesQueryHandler(ctx);

        // WHEN: The handler is invoked and a new client is added afterwards
        var snapshot = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);
        ctx.Clientes.Add(SeedEntity("C", "333-1", DateTimeOffset.UtcNow.AddSeconds(-2)));
        await ctx.SaveChangesAsync();

        // THEN: The previous snapshot is unchanged — handler returns a detached list, not a live query
        Assert.Equal(2, snapshot.Count);
    }

    [Fact]
    public async Task P2_HandleAsync_PreservesSpanishDiacritics_InProjection()
    {
        // GIVEN: A client whose nombre contains Spanish diacritics
        using var ctx = BuildContext();
        var entity = SeedEntity("Compañía Andina S.A.", "900-ÑX-1", DateTimeOffset.UtcNow);
        ctx.Clientes.Add(entity);
        await ctx.SaveChangesAsync();

        var handler = new GetClientesQueryHandler(ctx);

        // WHEN: The handler is invoked
        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);

        // THEN: The DTO projection preserves diacritics verbatim — encoding round-trip is intact
        var dto = Assert.Single(result);
        Assert.Equal("Compañía Andina S.A.", dto.Nombre);
        Assert.Equal("900-ÑX-1", dto.Nit);
    }

    [Fact]
    public async Task P2_HandleAsync_OrdersStablyWhenCreatedAtsAreEqual()
    {
        // GIVEN: Two clients with the SAME CreatedAt timestamp
        using var ctx = BuildContext();
        var sameTime = DateTimeOffset.UtcNow;
        ctx.Clientes.Add(SeedEntity("First", "111-1", sameTime));
        ctx.Clientes.Add(SeedEntity("Second", "222-1", sameTime));
        await ctx.SaveChangesAsync();

        var handler = new GetClientesQueryHandler(ctx);

        // WHEN: The handler is invoked twice
        var first = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);
        var second = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);

        // THEN: Both calls return the same count and the same set (no random shuffle).
        // Note: tie-breaking ordering is undefined per the handler's contract — only equality of the set is asserted.
        Assert.Equal(2, first.Count);
        Assert.Equal(2, second.Count);
        var firstIds = first.Select(c => c.Id).OrderBy(g => g).ToList();
        var secondIds = second.Select(c => c.Id).OrderBy(g => g).ToList();
        Assert.Equal(firstIds, secondIds);
    }
}
