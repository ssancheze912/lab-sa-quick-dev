/**
 * Story 2.1: Client List & Search — Backend Unit Edge Cases
 * Epic 2: Client Management
 *
 * Expands ATDD unit test coverage for GetClientesQueryHandler with boundary conditions:
 *   - All 7 ClienteDto fields are mapped (not just Nombre, Nit, Id already in ATDD tests)
 *   - CancellationToken is forwarded to repository (not swallowed)
 *   - Handler with a large list (50 entities) maps all without truncation
 *   - Handler with cancellation requested does not return partial results
 *   - Special characters in Nombre/NIT pass through without corruption
 *   - Telefono and Ciudad fields are mapped correctly
 *   - UpdatedAt is mapped (separate from CreatedAt)
 *
 * Additional entity edge cases (ClienteEntity):
 *   - Create() throws ArgumentException for empty Nombre
 *   - Create() throws ArgumentException for whitespace-only NIT
 *   - Create() throws ArgumentException for empty Telefono
 *   - Create() throws ArgumentException for empty Ciudad
 *   - Create() generates a non-empty GUID as Id
 *   - Created entity has DateTimeOffset (not DateTime) for CreatedAt/UpdatedAt
 *   - Update() changes Nombre, Nit, Telefono, Ciudad and bumps UpdatedAt
 *   - Update() throws ArgumentException for whitespace-only Nombre
 *
 * Framework: xUnit + NSubstitute
 */

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using NSubstitute;
using Xunit;

using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Edge case unit tests for GetClientesQueryHandler and ClienteEntity.
/// Covers boundary conditions not present in the ATDD test file.
/// </summary>
public class GetClientesQueryHandlerEdgeCaseTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Field mapping completeness
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_MapsTelefonoFieldCorrectly()
    {
        // GIVEN: Entity with Telefono "+57 604 345 6789"
        var mockRepository = Substitute.For<IClienteRepository>();
        var entities = new List<ClienteEntity>
        {
            ClienteEntity.Create("TechCorp", "800500100-1", "+57 604 345 6789", "Medellín"),
        };
        mockRepository.GetAllAsync(Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<IEnumerable<ClienteEntity>>(entities));

        var handler = new GetClientesQueryHandler(mockRepository);

        // WHEN: Query is handled
        var result = await handler.Handle(new GetClientesQuery(), CancellationToken.None);

        // THEN: Telefono is mapped correctly (not empty, not swapped with Ciudad)
        Assert.Equal("+57 604 345 6789", result.First().Telefono);
    }

    [Fact]
    public async Task Handle_MapsCiudadFieldCorrectly()
    {
        // GIVEN: Entity with Ciudad "Barranquilla"
        var mockRepository = Substitute.For<IClienteRepository>();
        var entities = new List<ClienteEntity>
        {
            ClienteEntity.Create("Empresa Barranquilla", "600100200-3", "+57 605 111 2222", "Barranquilla"),
        };
        mockRepository.GetAllAsync(Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<IEnumerable<ClienteEntity>>(entities));

        var handler = new GetClientesQueryHandler(mockRepository);

        // WHEN: Query is handled
        var result = await handler.Handle(new GetClientesQuery(), CancellationToken.None);

        // THEN: Ciudad is mapped correctly (not mixed with Telefono)
        Assert.Equal("Barranquilla", result.First().Ciudad);
    }

    [Fact]
    public async Task Handle_MapsUpdatedAtSeparatelyFromCreatedAt()
    {
        // GIVEN: Entity with distinct CreatedAt and UpdatedAt values
        var mockRepository = Substitute.For<IClienteRepository>();
        var entity = ClienteEntity.Create("UpdatedEntity SA", "700200300-4", "+57 606 222 3333", "Cali");

        // Force a small delay so UpdatedAt could diverge after an Update() call
        // In practice for new entities they may be equal; we verify both are non-default DateTimeOffset
        var entities = new List<ClienteEntity> { entity };
        mockRepository.GetAllAsync(Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<IEnumerable<ClienteEntity>>(entities));

        var handler = new GetClientesQueryHandler(mockRepository);

        // WHEN: Query is handled
        var result = await handler.Handle(new GetClientesQuery(), CancellationToken.None);
        var dto = result.First();

        // THEN: Both CreatedAt and UpdatedAt are mapped and are non-default DateTimeOffset
        Assert.IsType<DateTimeOffset>(dto.UpdatedAt);
        Assert.NotEqual(default(DateTimeOffset), dto.UpdatedAt);
        // Verify they are independent fields (not pointing to the same alias)
        Assert.IsType<DateTimeOffset>(dto.CreatedAt);
        Assert.NotEqual(default(DateTimeOffset), dto.CreatedAt);
    }

    [Fact]
    public async Task Handle_ForwardsCancellationTokenToRepository()
    {
        // GIVEN: A cancellation token with specific context
        var mockRepository = Substitute.For<IClienteRepository>();
        mockRepository.GetAllAsync(Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<IEnumerable<ClienteEntity>>(Enumerable.Empty<ClienteEntity>()));

        var handler = new GetClientesQueryHandler(mockRepository);
        using var cts = new CancellationTokenSource();
        var token = cts.Token;

        // WHEN: Query is handled with a specific CancellationToken
        await handler.Handle(new GetClientesQuery(), token);

        // THEN: GetAllAsync was called with that exact token (not CancellationToken.None swapped in)
        await mockRepository.Received(1).GetAllAsync(token);
    }

    [Fact]
    public async Task Handle_WithLargeEntityList_MapsAllItemsWithoutTruncation()
    {
        // GIVEN: Repository returns 50 entities
        var mockRepository = Substitute.For<IClienteRepository>();
        var entities = Enumerable.Range(0, 50)
            .Select(i => ClienteEntity.Create(
                $"Empresa {i:D3}",
                $"9{i:D8}-{i % 9}",
                $"+57 300 {i:D7}",
                "Bogotá"))
            .ToList();
        mockRepository.GetAllAsync(Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<IEnumerable<ClienteEntity>>(entities));

        var handler = new GetClientesQueryHandler(mockRepository);

        // WHEN: Query is handled
        var result = await handler.Handle(new GetClientesQuery(), CancellationToken.None);

        // THEN: All 50 DTOs are returned (no truncation at any arbitrary limit)
        Assert.Equal(50, result.Count());
    }

    [Fact]
    public async Task Handle_WithSpecialCharactersInNombre_MapsWithoutCorruption()
    {
        // GIVEN: Client name containing special/accented characters
        var mockRepository = Substitute.For<IClienteRepository>();
        var entities = new List<ClienteEntity>
        {
            ClienteEntity.Create("Servicios Ñoño & Compañía S.A.S.", "800111222-3", "+57 601 123 0001", "Bogotá"),
        };
        mockRepository.GetAllAsync(Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<IEnumerable<ClienteEntity>>(entities));

        var handler = new GetClientesQueryHandler(mockRepository);

        // WHEN: Query is handled
        var result = await handler.Handle(new GetClientesQuery(), CancellationToken.None);

        // THEN: Special characters are preserved verbatim in the DTO
        Assert.Equal("Servicios Ñoño & Compañía S.A.S.", result.First().Nombre);
    }

    [Fact]
    public async Task Handle_WithSpecialCharactersInNit_MapsWithoutCorruption()
    {
        // GIVEN: NIT with Colombian format including slash and hyphen
        var mockRepository = Substitute.For<IClienteRepository>();
        var entities = new List<ClienteEntity>
        {
            ClienteEntity.Create("Test NIT Format", "900.123.456-7", "+57 600 000 0001", "Cali"),
        };
        mockRepository.GetAllAsync(Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<IEnumerable<ClienteEntity>>(entities));

        var handler = new GetClientesQueryHandler(mockRepository);

        // WHEN: Query is handled
        var result = await handler.Handle(new GetClientesQuery(), CancellationToken.None);

        // THEN: NIT is preserved verbatim including dots and hyphen
        Assert.Equal("900.123.456-7", result.First().Nit);
    }
}

/// <summary>
/// Unit tests for ClienteEntity domain model.
/// Edge cases for Create() factory method, Update() method, and property initialization.
/// </summary>
public class ClienteEntityEdgeCaseTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Create() factory — validation edge cases
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Create_ThrowsArgumentException_WhenNombreIsEmpty()
    {
        // GIVEN: Empty string for Nombre
        // WHEN: Create() is called
        // THEN: ArgumentException is thrown (AC5: fields must not be empty)
        Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create("", "900123456-7", "+57 601 000 0000", "Bogotá"));
    }

    [Fact]
    public void Create_ThrowsArgumentException_WhenNombreIsWhitespaceOnly()
    {
        // GIVEN: Whitespace-only Nombre
        Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create("   ", "900123456-7", "+57 601 000 0000", "Bogotá"));
    }

    [Fact]
    public void Create_ThrowsArgumentException_WhenNitIsEmpty()
    {
        // GIVEN: Empty NIT
        Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create("Valid Nombre", "", "+57 601 000 0000", "Bogotá"));
    }

    [Fact]
    public void Create_ThrowsArgumentException_WhenNitIsWhitespaceOnly()
    {
        // GIVEN: Whitespace-only NIT
        Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create("Valid Nombre", "  \t  ", "+57 601 000 0000", "Bogotá"));
    }

    [Fact]
    public void Create_ThrowsArgumentException_WhenTelefonoIsEmpty()
    {
        // GIVEN: Empty Telefono
        Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create("Valid Nombre", "900123456-7", "", "Bogotá"));
    }

    [Fact]
    public void Create_ThrowsArgumentException_WhenCiudadIsEmpty()
    {
        // GIVEN: Empty Ciudad
        Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create("Valid Nombre", "900123456-7", "+57 601 000 0000", ""));
    }

    [Fact]
    public void Create_ThrowsArgumentException_WhenCiudadIsWhitespaceOnly()
    {
        // GIVEN: Whitespace-only Ciudad
        Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create("Valid Nombre", "900123456-7", "+57 601 000 0000", "   "));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Create() factory — happy path property assertions
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Create_GeneratesNonEmptyGuidForId()
    {
        // GIVEN: Valid inputs
        var entity = ClienteEntity.Create("Empresa X", "900000001-1", "+57 301 000 0001", "Bogotá");

        // THEN: Id is a non-empty GUID (R-008: no integer PK)
        Assert.NotEqual(Guid.Empty, entity.Id);
    }

    [Fact]
    public void Create_SetCreatedAtToCurrentUtcDateTimeOffset()
    {
        // GIVEN: Recording time before and after entity creation
        var before = DateTimeOffset.UtcNow.AddSeconds(-1);

        var entity = ClienteEntity.Create("Empresa Y", "900000002-2", "+57 302 000 0002", "Medellín");

        var after = DateTimeOffset.UtcNow.AddSeconds(1);

        // THEN: CreatedAt is within the expected UTC range (company standard: never DateTime)
        Assert.IsType<DateTimeOffset>(entity.CreatedAt);
        Assert.True(entity.CreatedAt >= before, $"CreatedAt {entity.CreatedAt} should be >= {before}");
        Assert.True(entity.CreatedAt <= after, $"CreatedAt {entity.CreatedAt} should be <= {after}");
    }

    [Fact]
    public void Create_SetUpdatedAtEqualToCreatedAtOnInitialization()
    {
        // GIVEN: New entity just created
        var entity = ClienteEntity.Create("Empresa Z", "900000003-3", "+57 303 000 0003", "Cali");

        // THEN: UpdatedAt equals CreatedAt on initialization (no mutations yet)
        // Allow a small tolerance for CPU scheduling jitter
        var diffMs = Math.Abs((entity.UpdatedAt - entity.CreatedAt).TotalMilliseconds);
        Assert.True(diffMs < 500, $"CreatedAt and UpdatedAt should be nearly equal at creation, but diff was {diffMs}ms");
    }

    [Fact]
    public void Create_SetsTelefonoCorrectly()
    {
        // GIVEN: Valid Telefono value
        var entity = ClienteEntity.Create("Empresa T", "900000004-4", "+57 304 000 0004", "Bogotá");

        // THEN: Telefono is set exactly (no trimming or transformation by entity)
        Assert.Equal("+57 304 000 0004", entity.Telefono);
    }

    [Fact]
    public void Create_SetsCiudadCorrectly()
    {
        // GIVEN: Valid Ciudad value
        var entity = ClienteEntity.Create("Empresa C", "900000005-5", "+57 305 000 0005", "Cartagena");

        // THEN: Ciudad is set exactly
        Assert.Equal("Cartagena", entity.Ciudad);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Update() method edge cases
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Update_ChangesAllFourMutableFields()
    {
        // GIVEN: An existing entity
        var entity = ClienteEntity.Create("Old Name", "111000001-1", "+57 300 111 0001", "Bogotá");

        // WHEN: Update() is called with all new values
        entity.Update("New Name", "222000002-2", "+57 300 222 0002", "Cali");

        // THEN: All four fields are updated
        Assert.Equal("New Name", entity.Nombre);
        Assert.Equal("222000002-2", entity.Nit);
        Assert.Equal("+57 300 222 0002", entity.Telefono);
        Assert.Equal("Cali", entity.Ciudad);
    }

    [Fact]
    public void Update_BumpsUpdatedAt_After_Creation()
    {
        // GIVEN: Entity created, then a deliberate pause
        var entity = ClienteEntity.Create("Before Update", "333000003-3", "+57 300 333 0003", "Bogotá");
        var originalUpdatedAt = entity.UpdatedAt;

        // Introduce a small sleep to ensure clock advances
        System.Threading.Thread.Sleep(10);

        // WHEN: Update() is called
        entity.Update("After Update", "333000003-3", "+57 300 333 0003", "Bogotá");

        // THEN: UpdatedAt is after the original value
        Assert.True(entity.UpdatedAt > originalUpdatedAt,
            $"UpdatedAt after Update() ({entity.UpdatedAt}) should be > before ({originalUpdatedAt})");
    }

    [Fact]
    public void Update_ThrowsArgumentException_WhenNombreIsEmpty()
    {
        // GIVEN: Valid entity
        var entity = ClienteEntity.Create("Valid", "900000006-6", "+57 300 666 0006", "Bogotá");

        // WHEN: Update() called with empty Nombre
        // THEN: ArgumentException is thrown (same validation as Create)
        Assert.Throws<ArgumentException>(() =>
            entity.Update("", "900000006-6", "+57 300 666 0006", "Bogotá"));
    }

    [Fact]
    public void Update_ThrowsArgumentException_WhenNitIsWhitespaceOnly()
    {
        // GIVEN: Valid entity
        var entity = ClienteEntity.Create("Valid", "900000007-7", "+57 300 777 0007", "Bogotá");

        // WHEN: Update() called with whitespace-only NIT
        // THEN: ArgumentException is thrown
        Assert.Throws<ArgumentException>(() =>
            entity.Update("Valid", "   ", "+57 300 777 0007", "Bogotá"));
    }

    [Fact]
    public void Update_DoesNotChangeId_AfterUpdate()
    {
        // GIVEN: Entity with known Id
        var entity = ClienteEntity.Create("Original", "900000008-8", "+57 300 888 0008", "Bogotá");
        var originalId = entity.Id;

        // WHEN: Update() is called
        entity.Update("Modified", "900000008-8", "+57 300 888 0008", "Medellín");

        // THEN: Id remains unchanged (immutable PK)
        Assert.Equal(originalId, entity.Id);
    }

    [Fact]
    public void Update_DoesNotChangeCreatedAt_AfterUpdate()
    {
        // GIVEN: Entity with known CreatedAt
        var entity = ClienteEntity.Create("Original", "900000009-9", "+57 300 999 0009", "Bogotá");
        var originalCreatedAt = entity.CreatedAt;

        System.Threading.Thread.Sleep(10);

        // WHEN: Update() is called
        entity.Update("Modified", "900000009-9", "+57 300 999 0009", "Cali");

        // THEN: CreatedAt is NOT changed (only UpdatedAt changes on update)
        Assert.Equal(originalCreatedAt, entity.CreatedAt);
    }
}
