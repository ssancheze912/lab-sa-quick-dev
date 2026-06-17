using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Moq;
using Xunit;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

// STORY 2.1 — Client List & Search
// Edge Case Tests (Unit Level — Application Layer)
// Expand coverage beyond the ATDD acceptance tests.
//
// Coverage gaps addressed:
//   - Handler propagates exception from repository (does not swallow errors)
//   - Handler returns list in same order as repository (no re-sorting)
//   - ClienteDto.CreatedAt is correctly mapped from ClienteEntity.CreatedAt
//   - ClienteDto.Telefono and Ciudad fields are correctly mapped
//   - Handler with single client returns list of length 1 (boundary: count == 1)
//   - ClienteDto is a record (value equality on all fields)

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Edge case tests for GetClientesQueryHandler.
/// Focuses on mapping correctness, error propagation, and boundary conditions.
/// Framework: xUnit + Moq
/// </summary>
public class GetClientesQueryHandlerEdgeCaseTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Edge: All DTO fields are correctly mapped from entity
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// GIVEN: IClienteRepository returns 1 entity with known field values
    /// WHEN:  GetClientesQueryHandler.HandleAsync is called
    /// THEN:  ClienteDto.Telefono matches entity.Telefono
    /// </summary>
    [Fact]
    public async Task GivenClienteEntity_WhenHandleAsync_ThenDtoTelefonoMatchesEntityTelefono()
    {
        // GIVEN: Entity with a specific Telefono
        var entity = ClienteEntity.Create("Empresa Tel Test", "900100001-1", "3009999999", "Cali");
        var repoMock = new Mock<IClienteRepository>();
        repoMock
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<ClienteEntity> { entity });

        var handler = new GetClientesQueryHandler(repoMock.Object);

        // WHEN: HandleAsync is called
        var result = await handler.HandleAsync(new GetClientesQuery());

        // THEN: DTO.Telefono matches entity.Telefono
        Assert.Equal("3009999999", result[0].Telefono);
    }

    /// <summary>
    /// GIVEN: IClienteRepository returns 1 entity with known Ciudad
    /// WHEN:  GetClientesQueryHandler.HandleAsync is called
    /// THEN:  ClienteDto.Ciudad matches entity.Ciudad
    /// </summary>
    [Fact]
    public async Task GivenClienteEntity_WhenHandleAsync_ThenDtoCiudadMatchesEntityCiudad()
    {
        // GIVEN: Entity with a specific Ciudad
        var entity = ClienteEntity.Create("Empresa Ciudad Test", "900200002-2", "3008888888", "Barranquilla");
        var repoMock = new Mock<IClienteRepository>();
        repoMock
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<ClienteEntity> { entity });

        var handler = new GetClientesQueryHandler(repoMock.Object);

        // WHEN: HandleAsync is called
        var result = await handler.HandleAsync(new GetClientesQuery());

        // THEN: DTO.Ciudad matches entity.Ciudad
        Assert.Equal("Barranquilla", result[0].Ciudad);
    }

    /// <summary>
    /// GIVEN: IClienteRepository returns 1 entity
    /// WHEN:  GetClientesQueryHandler.HandleAsync is called
    /// THEN:  ClienteDto.CreatedAt is close to DateTimeOffset.UtcNow (within 10 seconds)
    ///        This validates the mapping of DateTimeOffset — NOT DateTime.
    /// </summary>
    [Fact]
    public async Task GivenClienteEntity_WhenHandleAsync_ThenDtoCreatedAtIsDateTimeOffset()
    {
        // GIVEN: Entity created at approximately now
        var before = DateTimeOffset.UtcNow.AddSeconds(-1);
        var entity = ClienteEntity.Create("Empresa Fecha Test", "900300003-3", "3007777777", "Bogotá");
        var after = DateTimeOffset.UtcNow.AddSeconds(1);

        var repoMock = new Mock<IClienteRepository>();
        repoMock
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<ClienteEntity> { entity });

        var handler = new GetClientesQueryHandler(repoMock.Object);

        // WHEN: HandleAsync is called
        var result = await handler.HandleAsync(new GetClientesQuery());

        // THEN: CreatedAt is a DateTimeOffset between before and after
        Assert.IsType<DateTimeOffset>(result[0].CreatedAt);
        Assert.InRange(result[0].CreatedAt, before, after);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: Handler with single client returns list of length 1 (boundary)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// GIVEN: IClienteRepository returns exactly 1 entity (boundary: count == 1)
    /// WHEN:  GetClientesQueryHandler.HandleAsync is called
    /// THEN:  Result list has exactly 1 element (not 0, not 2)
    /// </summary>
    [Fact]
    public async Task GivenSingleClientInRepository_WhenHandleAsync_ThenReturnsListOfOne()
    {
        // GIVEN: Repository returns exactly 1 entity
        var repoMock = new Mock<IClienteRepository>();
        repoMock
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<ClienteEntity>
            {
                ClienteEntity.Create("Empresa Unico", "900400004-4", "3006666666", "Medellín"),
            });

        var handler = new GetClientesQueryHandler(repoMock.Object);

        // WHEN: HandleAsync is called
        var result = await handler.HandleAsync(new GetClientesQuery());

        // THEN: Result has exactly 1 item
        Assert.Equal(1, result.Count);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: Handler preserves order from repository (no re-sorting)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// GIVEN: Repository returns 3 entities in a specific order (C, A, B)
    /// WHEN:  GetClientesQueryHandler.HandleAsync is called
    /// THEN:  The result list preserves repository order (C, A, B) — no sort applied
    /// </summary>
    [Fact]
    public async Task GivenRepositoryReturnOrderCAB_WhenHandleAsync_ThenResultOrderPreservedCAB()
    {
        // GIVEN: Entities in order: Gamma (C), Alpha (A), Beta (B)
        var entities = new List<ClienteEntity>
        {
            ClienteEntity.Create("Gamma Corp", "900300003-3", "3003333333", "Cali"),
            ClienteEntity.Create("Alpha S.A.", "900100001-1", "3001111111", "Bogotá"),
            ClienteEntity.Create("Beta Ltda.", "900200002-2", "3002222222", "Medellín"),
        };

        var repoMock = new Mock<IClienteRepository>();
        repoMock
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(entities);

        var handler = new GetClientesQueryHandler(repoMock.Object);

        // WHEN: HandleAsync is called
        var result = await handler.HandleAsync(new GetClientesQuery());

        // THEN: Order matches repository order (no alphabetical sort by handler)
        Assert.Equal("Gamma Corp", result[0].Nombre);
        Assert.Equal("Alpha S.A.", result[1].Nombre);
        Assert.Equal("Beta Ltda.", result[2].Nombre);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: Handler propagates exception from repository
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// GIVEN: IClienteRepository.GetAllAsync() throws an InvalidOperationException
    /// WHEN:  GetClientesQueryHandler.HandleAsync is called
    /// THEN:  The exception is propagated (handler does NOT swallow it silently)
    ///        This ensures the API middleware (Problem Details) can handle it correctly
    /// </summary>
    [Fact]
    public async Task GivenRepositoryThrows_WhenHandleAsync_ThenExceptionPropagates()
    {
        // GIVEN: Repository throws an exception
        var repoMock = new Mock<IClienteRepository>();
        repoMock
            .Setup(r => r.GetAllAsync())
            .ThrowsAsync(new InvalidOperationException("Database connection lost"));

        var handler = new GetClientesQueryHandler(repoMock.Object);

        // WHEN / THEN: HandleAsync propagates the exception
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => handler.HandleAsync(new GetClientesQuery())
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: ClienteDto is a record — value equality on mapped fields
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// GIVEN: Two DTOs mapped from entities with identical field values
    /// WHEN:  DTOs are compared with equality (record value equality)
    /// THEN:  They are equal (record structural equality works as expected)
    /// </summary>
    [Fact]
    public async Task GivenTwoEntitiesWithSameFieldValues_WhenMappedToDtos_ThenDtosAreEqual()
    {
        // GIVEN: Two entities with the same UUID and field values (simulated)
        var fixedId = Guid.NewGuid();
        var fixedDate = new DateTimeOffset(2026, 6, 17, 14, 0, 0, TimeSpan.Zero);

        // Manually create matching DTOs to test record equality
        var dto1 = new ClienteDto(fixedId, "Empresa Igual", "900900009-9", "3009999999", "Bogotá", fixedDate);
        var dto2 = new ClienteDto(fixedId, "Empresa Igual", "900900009-9", "3009999999", "Bogotá", fixedDate);

        // THEN: Record equality holds — both DTOs are equal
        Assert.Equal(dto1, dto2);
    }
}
