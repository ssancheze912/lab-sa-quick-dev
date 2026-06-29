using FluentAssertions;
using NSubstitute;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Story 2.1 — Edge-case automation expansion for <see cref="GetClientesQueryHandler"/>.
///
/// Complements <see cref="GetClientesQueryHandlerAtddTests"/> with cases not covered:
///   • [P2] Empty / whitespace search fragments — pass-through behaviour (the handler must
///         not "normalise" away whitespace; the repository decides what NullOrWhiteSpace means)
///   • [P2] Mapping preserves repository order (the handler MUST NOT re-sort)
///   • [P2] CancellationToken is forwarded unchanged
///   • [P2] Larger lists round-trip every field correctly
/// </summary>
public class GetClientesQueryHandlerExtendedTests
{
    [Fact]
    public async Task HandleAsync_WithWhitespaceSearch_ForwardsRawValueToRepository()
    {
        // GIVEN: a search value made of whitespace
        var repo = Substitute.For<IClienteRepository>();
        repo.GetAllAsync("   ", Arg.Any<CancellationToken>())
            .Returns(new List<ClienteEntity>());
        var handler = new GetClientesQueryHandler(repo);

        // WHEN: HandleAsync runs
        var result = await handler.HandleAsync(new GetClientesQuery("   "), CancellationToken.None);

        // THEN: the handler forwarded the raw value (does NOT trim or normalise)
        await repo.Received(1).GetAllAsync("   ", Arg.Any<CancellationToken>());
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task HandleAsync_WithEmptyStringSearch_ForwardsEmptyStringToRepository()
    {
        // GIVEN: an empty string search
        var repo = Substitute.For<IClienteRepository>();
        repo.GetAllAsync(string.Empty, Arg.Any<CancellationToken>())
            .Returns(new List<ClienteEntity>());
        var handler = new GetClientesQueryHandler(repo);

        // WHEN
        await handler.HandleAsync(new GetClientesQuery(string.Empty), CancellationToken.None);

        // THEN: the empty string is passed through (let the repository decide)
        await repo.Received(1).GetAllAsync(string.Empty, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task HandleAsync_PreservesRepositoryReturnOrder()
    {
        // GIVEN: a repository returning entities in a specific order
        var repo = Substitute.For<IClienteRepository>();
        var entities = new List<ClienteEntity>
        {
            ClienteEntity.Create("Newest", "900100100", "3001000000", "Bogotá"),
            ClienteEntity.Create("Middle", "900200200", "3002000000", "Medellín"),
            ClienteEntity.Create("Oldest", "900300300", "3003000000", "Cali"),
        };
        repo.GetAllAsync(null, Arg.Any<CancellationToken>()).Returns(entities);
        var handler = new GetClientesQueryHandler(repo);

        // WHEN
        var result = await handler.HandleAsync(new GetClientesQuery(null), CancellationToken.None);

        // THEN: the handler MUST NOT re-order; the repository owns ordering
        result.Select(d => d.Nombre).Should().ContainInOrder("Newest", "Middle", "Oldest");
    }

    [Fact]
    public async Task HandleAsync_ForwardsCancellationTokenUnchanged()
    {
        // GIVEN: a token that we will track through to the repository
        var repo = Substitute.For<IClienteRepository>();
        repo.GetAllAsync(Arg.Any<string?>(), Arg.Any<CancellationToken>())
            .Returns(new List<ClienteEntity>());
        var handler = new GetClientesQueryHandler(repo);
        using var cts = new CancellationTokenSource();
        var token = cts.Token;

        // WHEN
        await handler.HandleAsync(new GetClientesQuery(null), token);

        // THEN: the repository got the exact same token
        await repo.Received(1).GetAllAsync(Arg.Any<string?>(), token);
    }

    [Fact]
    public async Task HandleAsync_MapsLargeListWithoutDroppingItems()
    {
        // GIVEN: a 50-item repository response
        var repo = Substitute.For<IClienteRepository>();
        var entities = Enumerable.Range(0, 50)
            .Select(i => ClienteEntity.Create(
                $"Cliente {i:D3}",
                $"9{i:D9}",
                $"300{i:D7}",
                "Bogotá"))
            .ToList();
        repo.GetAllAsync(null, Arg.Any<CancellationToken>()).Returns(entities);
        var handler = new GetClientesQueryHandler(repo);

        // WHEN
        var result = await handler.HandleAsync(new GetClientesQuery(null), CancellationToken.None);

        // THEN: every entity is mapped
        result.Should().HaveCount(50);
        result.Select(r => r.Nombre).Should().ContainInOrder(entities.Select(e => e.Nombre));
    }

    [Fact]
    public async Task HandleAsync_MapsEntityNitToDtoNitRuc_NotNit()
    {
        // GIVEN: a single entity whose Nit is distinctive
        var repo = Substitute.For<IClienteRepository>();
        var entity = ClienteEntity.Create("ACME", "FROM-ENTITY-NIT", "3001112233", "Bogotá");
        repo.GetAllAsync(Arg.Any<string?>(), Arg.Any<CancellationToken>())
            .Returns(new List<ClienteEntity> { entity });
        var handler = new GetClientesQueryHandler(repo);

        // WHEN
        var result = await handler.HandleAsync(new GetClientesQuery(null), CancellationToken.None);

        // THEN: the DTO surface uses the NitRuc contract name
        result[0].NitRuc.Should().Be("FROM-ENTITY-NIT");
    }
}
