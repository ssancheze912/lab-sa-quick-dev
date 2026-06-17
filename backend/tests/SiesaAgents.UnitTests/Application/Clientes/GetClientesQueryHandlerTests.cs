using System.Collections.Generic;
using System.Threading.Tasks;
using Moq;
using Xunit;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

// STORY 2.1 — Client List & Search
// ATDD Acceptance Tests — RED Phase (Unit Level — Application Layer)
// These tests FAIL until the implementation is complete.
//
// AC Coverage:
//   AC1 — GetClientesQueryHandler maps IClienteRepository.GetAllAsync() to ClienteDto list
//   AC1 — Handler returns empty list (not null, not exception) when repository returns empty
//   AC1 — ClienteDto fields (Id, Nombre, NitRuc, Telefono, Ciudad, CreatedAt) are correctly mapped

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Unit tests for GetClientesQueryHandler (Story 2.1 — Application layer).
/// Uses Moq to isolate the handler from IClienteRepository.
/// Framework: xUnit + Moq
/// </summary>
public class GetClientesQueryHandlerTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Happy path: Handler maps repository results to ClienteDto list
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// GIVEN: IClienteRepository.GetAllAsync() returns 3 ClienteEntity objects
    /// WHEN:  GetClientesQueryHandler.HandleAsync(new GetClientesQuery()) is called
    /// THEN:  Returns a list of 3 ClienteDto items
    /// RED:   Fails because GetClientesQueryHandler class does not exist yet
    /// </summary>
    [Fact]
    public async Task GivenThreeClientsInRepository_WhenHandleAsync_ThenReturnsThreeClienteDtos()
    {
        // GIVEN: IClienteRepository returns 3 entities
        var repoMock = new Mock<IClienteRepository>();
        repoMock
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<ClienteEntity>
            {
                ClienteEntity.Create("Empresa Alfa S.A.S.", "900111001-1", "3001111111", "Bogotá"),
                ClienteEntity.Create("Empresa Beta Ltda.", "900222002-2", "3002222222", "Medellín"),
                ClienteEntity.Create("Empresa Gamma Corp.", "900333003-3", "3003333333", "Cali"),
            });

        var handler = new GetClientesQueryHandler(repoMock.Object);

        // WHEN: HandleAsync is called with an empty query
        var result = await handler.HandleAsync(new GetClientesQuery());

        // THEN: Result contains exactly 3 ClienteDto items
        Assert.NotNull(result);
        Assert.Equal(3, result.Count);
    }

    /// <summary>
    /// GIVEN: IClienteRepository.GetAllAsync() returns a single entity with known fields
    /// WHEN:  GetClientesQueryHandler.HandleAsync is called
    /// THEN:  The resulting ClienteDto has Nombre mapped correctly from entity.Nombre
    /// RED:   Fails because GetClientesQueryHandler does not exist yet
    /// </summary>
    [Fact]
    public async Task GivenClienteEntity_WhenHandleAsync_ThenDtoNombreMatchesEntityNombre()
    {
        // GIVEN: Repository returns 1 entity with a known Nombre
        var repoMock = new Mock<IClienteRepository>();
        repoMock
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<ClienteEntity>
            {
                ClienteEntity.Create("Empresa Mapeo Test", "900400004-4", "3004444444", "Pereira"),
            });

        var handler = new GetClientesQueryHandler(repoMock.Object);

        // WHEN: HandleAsync is called
        var result = await handler.HandleAsync(new GetClientesQuery());

        // THEN: ClienteDto.Nombre == entity.Nombre
        Assert.Equal("Empresa Mapeo Test", result[0].Nombre);
    }

    /// <summary>
    /// GIVEN: IClienteRepository.GetAllAsync() returns a single entity with Nit "900400004-4"
    /// WHEN:  GetClientesQueryHandler.HandleAsync is called
    /// THEN:  The resulting ClienteDto has NitRuc == "900400004-4"
    ///        (entity property Nit → DTO property NitRuc — different names!)
    /// RED:   Fails because mapping does not exist yet
    /// </summary>
    [Fact]
    public async Task GivenClienteEntity_WhenHandleAsync_ThenDtoNitRucMatchesEntityNit()
    {
        // GIVEN: Repository returns 1 entity with Nit "900400004-4"
        var repoMock = new Mock<IClienteRepository>();
        repoMock
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<ClienteEntity>
            {
                ClienteEntity.Create("Empresa NIT Mapeo", "900400004-4", "3004444444", "Cúcuta"),
            });

        var handler = new GetClientesQueryHandler(repoMock.Object);

        // WHEN: HandleAsync is called
        var result = await handler.HandleAsync(new GetClientesQuery());

        // THEN: ClienteDto.NitRuc == "900400004-4"  (entity.Nit → dto.NitRuc)
        Assert.Equal("900400004-4", result[0].NitRuc);
    }

    /// <summary>
    /// GIVEN: IClienteRepository.GetAllAsync() returns a single entity
    /// WHEN:  GetClientesQueryHandler.HandleAsync is called
    /// THEN:  ClienteDto.Id matches ClienteEntity.Id (UUID round-trip)
    /// RED:   Fails because GetClientesQueryHandler does not exist yet
    /// </summary>
    [Fact]
    public async Task GivenClienteEntity_WhenHandleAsync_ThenDtoIdMatchesEntityId()
    {
        // GIVEN: Repository returns 1 entity — capture its generated Id
        var entity = ClienteEntity.Create("Empresa ID Mapeo", "900600006-6", "3006666666", "Manizales");
        var repoMock = new Mock<IClienteRepository>();
        repoMock
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<ClienteEntity> { entity });

        var handler = new GetClientesQueryHandler(repoMock.Object);

        // WHEN: HandleAsync is called
        var result = await handler.HandleAsync(new GetClientesQuery());

        // THEN: DTO Id == entity Id (UUID matches)
        Assert.Equal(entity.Id, result[0].Id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge case: Empty repository returns empty list (not null, not exception)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// GIVEN: IClienteRepository.GetAllAsync() returns an empty list
    /// WHEN:  GetClientesQueryHandler.HandleAsync is called
    /// THEN:  Handler returns an empty list — NOT null, NOT an exception
    /// RED:   Fails because GetClientesQueryHandler does not exist yet
    /// </summary>
    [Fact]
    public async Task GivenEmptyRepository_WhenHandleAsync_ThenReturnsEmptyList()
    {
        // GIVEN: Repository returns empty list
        var repoMock = new Mock<IClienteRepository>();
        repoMock
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<ClienteEntity>());

        var handler = new GetClientesQueryHandler(repoMock.Object);

        // WHEN: HandleAsync is called
        var result = await handler.HandleAsync(new GetClientesQuery());

        // THEN: Result is not null and is empty
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    /// <summary>
    /// GIVEN: IClienteRepository.GetAllAsync() is called
    /// WHEN:  GetClientesQueryHandler.HandleAsync is called
    /// THEN:  IClienteRepository.GetAllAsync() is called exactly once
    /// RED:   Fails because GetClientesQueryHandler does not exist yet
    /// </summary>
    [Fact]
    public async Task GivenQuery_WhenHandleAsync_ThenRepositoryGetAllCalledExactlyOnce()
    {
        // GIVEN: Mock repository returning empty list
        var repoMock = new Mock<IClienteRepository>();
        repoMock
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<ClienteEntity>());

        var handler = new GetClientesQueryHandler(repoMock.Object);

        // WHEN: HandleAsync is called
        await handler.HandleAsync(new GetClientesQuery());

        // THEN: GetAllAsync was invoked exactly once
        repoMock.Verify(r => r.GetAllAsync(), Times.Once);
    }
}
