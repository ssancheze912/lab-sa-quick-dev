using FluentAssertions;
using NSubstitute;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Story 2.1 — Client List & Search — Application ATDD (RED phase).
///
/// Acceptance criterion covered:
///   AC #2 — GetClientesQueryHandler delegates the optional search fragment
///           to IClienteRepository.GetAllAsync and maps ClienteEntity → ClienteDto.
///
/// These tests MUST fail until the handler, query record, DTO, and IClienteRepository
/// interface exist in the Application/Domain layers.
/// </summary>
public class GetClientesQueryHandlerAtddTests
{
    [Fact]
    public async Task HandleAsync_NoSearch_DelegatesNullToRepositoryAndReturnsMappedDtos()
    {
        // GIVEN: a repository that returns 2 entities
        var repo = Substitute.For<IClienteRepository>();
        var entities = new List<ClienteEntity>
        {
            ClienteEntity.Create("Cliente A", "900111222", "3001112233", "Bogotá"),
            ClienteEntity.Create("Cliente B", "800999888", "3009998888", "Medellín"),
        };
        repo.GetAllAsync(null, Arg.Any<CancellationToken>()).Returns(entities);

        var handler = new GetClientesQueryHandler(repo);

        // WHEN: HandleAsync runs with null search
        var result = await handler.HandleAsync(new GetClientesQuery(null), CancellationToken.None);

        // THEN: handler delegates with null search and maps to DTOs
        await repo.Received(1).GetAllAsync(null, Arg.Any<CancellationToken>());
        result.Should().HaveCount(2);
        result.Select(d => d.Nombre).Should().ContainInOrder("Cliente A", "Cliente B");
    }

    [Fact]
    public async Task HandleAsync_WithSearch_PassesFragmentToRepository()
    {
        // GIVEN: a repository that returns a single match
        var repo = Substitute.For<IClienteRepository>();
        var entity = ClienteEntity.Create("Distribuidora ACME", "900111222", "3001112233", "Bogotá");
        repo.GetAllAsync("acme", Arg.Any<CancellationToken>()).Returns(new List<ClienteEntity> { entity });

        var handler = new GetClientesQueryHandler(repo);

        // WHEN: HandleAsync runs with a search fragment
        var result = await handler.HandleAsync(new GetClientesQuery("acme"), CancellationToken.None);

        // THEN: the fragment reaches the repository unchanged
        await repo.Received(1).GetAllAsync("acme", Arg.Any<CancellationToken>());
        result.Should().HaveCount(1);
        result[0].Nombre.Should().Be("Distribuidora ACME");
    }

    [Fact]
    public async Task HandleAsync_EmptyRepository_ReturnsEmptyList()
    {
        // GIVEN: a repository that returns an empty list
        var repo = Substitute.For<IClienteRepository>();
        repo.GetAllAsync(Arg.Any<string?>(), Arg.Any<CancellationToken>())
            .Returns(new List<ClienteEntity>());

        var handler = new GetClientesQueryHandler(repo);

        // WHEN: HandleAsync runs
        var result = await handler.HandleAsync(new GetClientesQuery(null), CancellationToken.None);

        // THEN: an empty list (not null) is returned
        result.Should().NotBeNull();
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task HandleAsync_MapsEntityFieldsToDtoFields()
    {
        // GIVEN: a single entity with known field values
        var repo = Substitute.For<IClienteRepository>();
        var entity = ClienteEntity.Create("ACME", "900111222", "3001112233", "Bogotá");
        repo.GetAllAsync(Arg.Any<string?>(), Arg.Any<CancellationToken>())
            .Returns(new List<ClienteEntity> { entity });

        var handler = new GetClientesQueryHandler(repo);

        // WHEN: HandleAsync runs
        var result = await handler.HandleAsync(new GetClientesQuery(null), CancellationToken.None);

        // THEN: every field is mapped from entity.Nit → dto.NitRuc
        result.Should().HaveCount(1);
        var dto = result[0];
        dto.Id.Should().Be(entity.Id);
        dto.Nombre.Should().Be(entity.Nombre);
        dto.NitRuc.Should().Be(entity.Nit, "the DTO contract field is NitRuc, mapped from entity.Nit");
        dto.Telefono.Should().Be(entity.Telefono);
        dto.Ciudad.Should().Be(entity.Ciudad);
        dto.CreatedAt.Should().Be(entity.CreatedAt);
        dto.UpdatedAt.Should().Be(entity.UpdatedAt);
        dto.GetType().Should().Be(typeof(ClienteDto));
    }
}
