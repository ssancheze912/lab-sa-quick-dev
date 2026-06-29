using FluentAssertions;
using NSubstitute;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Story 2.2 — Client Detail View — Application layer unit tests.
///
/// Acceptance criteria covered:
///   AC #1 — GetClienteByIdQueryHandler maps ClienteEntity → ClienteDto using
///           the same projection as GetClientesQueryHandler (Nit → NitRuc).
///   AC #2 — Handler returns null (does NOT throw) when the repository
///           reports no entity. The API layer translates this into a 404
///           Problem Details response.
/// </summary>
public class GetClienteByIdQueryHandlerTests
{
    [Fact]
    public async Task HandleAsync_WhenRepositoryReturnsEntity_ReturnsMappedDto()
    {
        // GIVEN: a repository that returns a known entity
        var repo = Substitute.For<IClienteRepository>();
        var entity = ClienteEntity.Create("ACME Detail", "900111222", "3001112233", "Bogotá");
        repo.GetByIdAsync(entity.Id, Arg.Any<CancellationToken>()).Returns(entity);

        var handler = new GetClienteByIdQueryHandler(repo);

        // WHEN: HandleAsync runs
        var result = await handler.HandleAsync(new GetClienteByIdQuery(entity.Id), CancellationToken.None);

        // THEN: a fully mapped DTO is returned
        result.Should().NotBeNull();
        result!.Id.Should().Be(entity.Id);
        result.Nombre.Should().Be(entity.Nombre);
        result.NitRuc.Should().Be(entity.Nit, "DTO contract is NitRuc, mapped from entity.Nit");
        result.Telefono.Should().Be(entity.Telefono);
        result.Ciudad.Should().Be(entity.Ciudad);
        result.CreatedAt.Should().Be(entity.CreatedAt);
        result.UpdatedAt.Should().Be(entity.UpdatedAt);
    }

    [Fact]
    public async Task HandleAsync_WhenRepositoryReturnsNull_ReturnsNull()
    {
        // GIVEN: a repository that returns null
        var repo = Substitute.For<IClienteRepository>();
        var id = Guid.NewGuid();
        repo.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns((ClienteEntity?)null);

        var handler = new GetClienteByIdQueryHandler(repo);

        // WHEN: HandleAsync runs
        var result = await handler.HandleAsync(new GetClienteByIdQuery(id), CancellationToken.None);

        // THEN: null is returned — no exception thrown (controlled state, NOT exception flow)
        result.Should().BeNull();
    }

    [Fact]
    public async Task HandleAsync_PassesIdAndCancellationTokenToRepository()
    {
        // GIVEN: a repository capturing its arguments
        var repo = Substitute.For<IClienteRepository>();
        var id = Guid.NewGuid();
        var cts = new CancellationTokenSource();
        var ct = cts.Token;
        repo.GetByIdAsync(id, ct).Returns((ClienteEntity?)null);

        var handler = new GetClienteByIdQueryHandler(repo);

        // WHEN
        await handler.HandleAsync(new GetClienteByIdQuery(id), ct);

        // THEN: arguments forwarded verbatim
        await repo.Received(1).GetByIdAsync(id, ct);
    }
}
