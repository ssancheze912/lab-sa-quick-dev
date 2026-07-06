using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Story 2.1 (Epic 2: Client Management) — Automation Expansion (testarch-automate).
///
/// No handler-level unit test existed in the ATDD RED-phase suite (only the domain entity
/// and the full integration/HTTP path were covered) — this closes that gap by exercising
/// <see cref="GetClientesQueryHandler"/> in isolation against a hand-rolled fake
/// <see cref="IClienteRepository"/> (no mocking framework is referenced by
/// SiesaAgents.UnitTests.csproj, so a fake keeps this dependency-free).
///
/// Verifies the Domain → DTO mapping contract independently of EF Core/HTTP, and the
/// empty-repository boundary.
/// </summary>
public class GetClientesQueryHandlerTests
{
    [Fact]
    public async Task Handle_ReturnsEmptyList_WhenRepositoryHasNoClientes()
    {
        // GIVEN a repository with no records
        var handler = new GetClientesQueryHandler(new FakeClienteRepository());

        // WHEN the query is handled
        var result = await handler.Handle(new GetClientesQuery(), CancellationToken.None);

        // THEN an empty list is returned (never null)
        Assert.Empty(result);
    }

    [Fact]
    public async Task Handle_MapsAllFieldsFromEntityToDto()
    {
        // GIVEN a repository containing one fully-populated entity
        var entity = ClienteEntity.Create("Acme Corp", "900123456", "3001234567", "Bogotá");
        var handler = new GetClientesQueryHandler(new FakeClienteRepository(entity));
        var expectedDto = new ClienteDto(entity.Id, entity.Nombre, entity.Nit, entity.Telefono, entity.Ciudad, entity.CreatedAt);

        // WHEN the query is handled
        var result = await handler.Handle(new GetClientesQuery(), CancellationToken.None);

        // THEN every field is mapped verbatim onto the DTO — a single atomic value-equality
        // assertion, since ClienteDto is a record with structural equality (TEA Review:
        // replaces 6 independent per-field Assert.Equal calls with one atomic assertion)
        Assert.Equal(expectedDto, Assert.Single(result));
    }

    [Fact]
    public async Task Handle_ReturnsOneDtoPerEntity_PreservingCount()
    {
        // GIVEN a repository containing multiple entities
        var entities = new[]
        {
            ClienteEntity.Create("Acme Corp", "900111111", "3001111111", "Bogotá"),
            ClienteEntity.Create("Beta SAS", "900222222", "3002222222", "Medellín"),
            ClienteEntity.Create("Gamma Ltda", "900333333", "3003333333", "Cali"),
        };
        var handler = new GetClientesQueryHandler(new FakeClienteRepository(entities));

        // WHEN the query is handled
        var result = await handler.Handle(new GetClientesQuery(), CancellationToken.None);

        // THEN exactly one DTO exists per source entity, none dropped or duplicated
        Assert.Equal(entities.Length, result.Count);
        Assert.All(entities, entity => Assert.Contains(result, dto => dto.Id == entity.Id));
    }

    /// <summary>
    /// Minimal in-memory fake — no mocking framework dependency, per project's ATDD
    /// conventions for handler-level unit tests.
    /// </summary>
    private sealed class FakeClienteRepository(params ClienteEntity[] clientes) : IClienteRepository
    {
        private readonly IReadOnlyList<ClienteEntity> _clientes = clientes.ToList();

        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken) =>
            Task.FromResult(_clientes);

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
            Task.FromResult(_clientes.FirstOrDefault(c => c.Id == id));

        public Task<bool> AddAsync(ClienteEntity cliente, CancellationToken cancellationToken) =>
            Task.FromResult(true);

        public Task<bool> UpdateAsync(ClienteEntity cliente, CancellationToken cancellationToken) =>
            Task.FromResult(true);

        public Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken) =>
            Task.FromResult(true);
    }
}
