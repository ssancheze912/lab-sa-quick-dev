using FluentAssertions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Story 2.2 — Edge-case automation expansion for <see cref="GetClienteByIdQueryHandler"/>.
///
/// Complements <see cref="GetClienteByIdQueryHandlerTests"/> with cases the ATDD layer omits:
///   • [P2] Guid.Empty is forwarded to the repository unchanged (no special handling)
///   • [P2] Repository exceptions propagate up — the handler does NOT swallow them
///   • [P2] Sequential calls do NOT share or mutate state between invocations
///   • [P2] Mapping preserves Spanish characters and special diacritics verbatim
///   • [P2] Mapping preserves DateTimeOffset values WITH the original timezone
/// </summary>
public class GetClienteByIdQueryHandlerExtendedTests
{
    [Fact]
    public async Task HandleAsync_GuidEmpty_IsForwardedToRepositoryUnchanged()
    {
        // GIVEN: repository returns null for any Guid (including Guid.Empty)
        var repo = Substitute.For<IClienteRepository>();
        repo.GetByIdAsync(Guid.Empty, Arg.Any<CancellationToken>()).Returns((ClienteEntity?)null);
        var handler = new GetClienteByIdQueryHandler(repo);

        // WHEN
        var result = await handler.HandleAsync(new GetClienteByIdQuery(Guid.Empty), CancellationToken.None);

        // THEN: Guid.Empty was forwarded verbatim AND null returned (no extra logic)
        result.Should().BeNull();
        await repo.Received(1).GetByIdAsync(Guid.Empty, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task HandleAsync_WhenRepositoryThrows_PropagatesTheException()
    {
        // GIVEN: repository throws (e.g. DB connection lost)
        var repo = Substitute.For<IClienteRepository>();
        var id = Guid.NewGuid();
        repo.GetByIdAsync(id, Arg.Any<CancellationToken>())
            .ThrowsAsync(new InvalidOperationException("DB timeout"));
        var handler = new GetClienteByIdQueryHandler(repo);

        // WHEN / THEN: the handler does NOT swallow the exception
        var act = async () => await handler.HandleAsync(new GetClienteByIdQuery(id), CancellationToken.None);
        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("DB timeout");
    }

    [Fact]
    public async Task HandleAsync_SequentialCalls_DoNotShareState()
    {
        // GIVEN: a single handler instance reused across two calls with different ids
        var repo = Substitute.For<IClienteRepository>();
        var entityA = ClienteEntity.Create("Cliente A", "900000001", "3001000001", "Bogotá");
        var entityB = ClienteEntity.Create("Cliente B", "900000002", "3001000002", "Medellín");
        repo.GetByIdAsync(entityA.Id, Arg.Any<CancellationToken>()).Returns(entityA);
        repo.GetByIdAsync(entityB.Id, Arg.Any<CancellationToken>()).Returns(entityB);
        var handler = new GetClienteByIdQueryHandler(repo);

        // WHEN
        var resultA = await handler.HandleAsync(new GetClienteByIdQuery(entityA.Id), CancellationToken.None);
        var resultB = await handler.HandleAsync(new GetClienteByIdQuery(entityB.Id), CancellationToken.None);

        // THEN: each call returns the correct DTO; state is NOT shared
        resultA!.Id.Should().Be(entityA.Id);
        resultA.Nombre.Should().Be("Cliente A");
        resultB!.Id.Should().Be(entityB.Id);
        resultB.Nombre.Should().Be("Cliente B");
        resultA.Id.Should().NotBe(resultB.Id);
    }

    [Fact]
    public async Task HandleAsync_WhenEntityHasSpanishDiacritics_MappingIsVerbatim()
    {
        // GIVEN: a repository returning an entity with Spanish characters
        var repo = Substitute.For<IClienteRepository>();
        var entity = ClienteEntity.Create(
            "Distribuidora Ñoño & Compañía S.A.S.",
            "900111223",
            "3001112234",
            "Bogotá");
        repo.GetByIdAsync(entity.Id, Arg.Any<CancellationToken>()).Returns(entity);
        var handler = new GetClienteByIdQueryHandler(repo);

        // WHEN
        var result = await handler.HandleAsync(new GetClienteByIdQuery(entity.Id), CancellationToken.None);

        // THEN: diacritics preserved verbatim (no Latin-1 normalisation)
        result.Should().NotBeNull();
        result!.Nombre.Should().Be("Distribuidora Ñoño & Compañía S.A.S.");
        result.Ciudad.Should().Be("Bogotá");
    }

    [Fact]
    public async Task HandleAsync_PreservesDateTimeOffsetTimezone()
    {
        // GIVEN: entity created in UTC (default); the mapper MUST preserve
        // the DateTimeOffset values exactly (NOT convert to local time).
        var repo = Substitute.For<IClienteRepository>();
        var entity = ClienteEntity.Create("TZ Test", "900111224", "3001112235", "Cali");
        repo.GetByIdAsync(entity.Id, Arg.Any<CancellationToken>()).Returns(entity);
        var handler = new GetClienteByIdQueryHandler(repo);

        // WHEN
        var result = await handler.HandleAsync(new GetClienteByIdQuery(entity.Id), CancellationToken.None);

        // THEN: the DTO carries the same DateTimeOffset values byte-for-byte
        result.Should().NotBeNull();
        result!.CreatedAt.Should().Be(entity.CreatedAt);
        result.UpdatedAt.Should().Be(entity.UpdatedAt);
        // And the offset is preserved (a sanity-check: equality on
        // DateTimeOffset already compares the offset, but this makes it
        // explicit).
        result.CreatedAt.Offset.Should().Be(entity.CreatedAt.Offset);
    }

    [Fact]
    public async Task HandleAsync_CancelledToken_PassesCancellationThrough()
    {
        // GIVEN: a token that is already cancelled
        var repo = Substitute.For<IClienteRepository>();
        var id = Guid.NewGuid();
        using var cts = new CancellationTokenSource();
        cts.Cancel();

        // Simulate cancellation: the repository throws when token is cancelled.
        repo.GetByIdAsync(id, cts.Token).ThrowsAsync(new OperationCanceledException());
        var handler = new GetClienteByIdQueryHandler(repo);

        // WHEN / THEN: the cancellation surfaces as OperationCanceledException
        var act = async () => await handler.HandleAsync(new GetClienteByIdQuery(id), cts.Token);
        await act.Should().ThrowAsync<OperationCanceledException>();
    }
}
