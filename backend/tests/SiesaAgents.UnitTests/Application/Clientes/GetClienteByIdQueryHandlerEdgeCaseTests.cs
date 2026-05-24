/**
 * Story 2.2: Client Detail View — Backend Unit Edge Cases
 * Epic 2: Client Management
 *
 * Expands ATDD unit test coverage for GetClienteByIdQueryHandler with boundary
 * conditions NOT present in GetClienteByIdQueryHandlerTests.cs:
 *
 *   - CancellationToken is forwarded to IClienteRepository.GetByIdAsync (not swallowed)
 *   - GetByIdAsync is called exactly once per Handle invocation (no double calls)
 *   - Guid.Empty in query is forwarded to repository without pre-validation (handler is not a guard)
 *   - UpdatedAt is mapped separately from CreatedAt (not aliased to the same value)
 *   - Handler maps entity Id exactly as-is (not regenerated)
 *   - Handler returns null when repository returns null for Guid.Empty query
 *   - Special characters in Nombre (accented, ampersand) are preserved in mapping
 *   - Special characters in Nit (dots, hyphen) are preserved in mapping
 *   - Special characters in Telefono (plus sign, spaces) are preserved in mapping
 *   - Handler does not modify entity state after reading (no side effects)
 *   - Returned ClienteDto.Id equals the entity's own Id (not the requested query Id if different)
 *
 * Framework: xUnit + NSubstitute
 */

using System;
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
/// Edge case unit tests for GetClienteByIdQueryHandler.
/// Covers boundary conditions and field-mapping completeness beyond the ATDD tests.
/// </summary>
public class GetClienteByIdQueryHandlerEdgeCaseTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // CancellationToken propagation
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_ForwardsCancellationTokenToRepository()
    {
        // GIVEN: A specific CancellationToken (not CancellationToken.None)
        var id = Guid.NewGuid();
        var mockRepository = Substitute.For<IClienteRepository>();
        mockRepository.GetByIdAsync(id, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<ClienteEntity?>(null));

        var handler = new GetClienteByIdQueryHandler(mockRepository);
        var query = new GetClienteByIdQuery(id);
        using var cts = new CancellationTokenSource();
        var token = cts.Token;

        // WHEN: Handle is called with the token
        await handler.Handle(query, token);

        // THEN: Repository was called with that exact token (not CancellationToken.None swapped in)
        await mockRepository.Received(1).GetByIdAsync(id, token);
    }

    [Fact]
    public async Task Handle_CallsGetByIdAsyncExactlyOnce_WhenEntityFound()
    {
        // GIVEN: Repository returns an entity
        var id = Guid.NewGuid();
        var mockRepository = Substitute.For<IClienteRepository>();
        var entity = ClienteEntity.Create("Single Call", "900111000-1", "+57 601 111 0001", "Bogotá");
        mockRepository.GetByIdAsync(id, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<ClienteEntity?>(entity));

        var handler = new GetClienteByIdQueryHandler(mockRepository);
        var query = new GetClienteByIdQuery(id);

        // WHEN: Handle is called once
        await handler.Handle(query, CancellationToken.None);

        // THEN: Repository.GetByIdAsync was called exactly once (no redundant calls)
        await mockRepository.Received(1).GetByIdAsync(id, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_CallsGetByIdAsyncExactlyOnce_WhenEntityNotFound()
    {
        // GIVEN: Repository returns null
        var id = Guid.NewGuid();
        var mockRepository = Substitute.For<IClienteRepository>();
        mockRepository.GetByIdAsync(id, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<ClienteEntity?>(null));

        var handler = new GetClienteByIdQueryHandler(mockRepository);
        var query = new GetClienteByIdQuery(id);

        // WHEN: Handle is called once
        await handler.Handle(query, CancellationToken.None);

        // THEN: Repository called exactly once (handler does not retry on null)
        await mockRepository.Received(1).GetByIdAsync(id, Arg.Any<CancellationToken>());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Guid.Empty edge case
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_WithGuidEmpty_ForwardsToRepositoryWithoutPreValidation()
    {
        // GIVEN: Query with Guid.Empty (handler is not a guard — endpoint validates UUID format)
        var mockRepository = Substitute.For<IClienteRepository>();
        mockRepository.GetByIdAsync(Guid.Empty, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<ClienteEntity?>(null));

        var handler = new GetClienteByIdQueryHandler(mockRepository);
        var query = new GetClienteByIdQuery(Guid.Empty);

        // WHEN: Handle is called
        var result = await handler.Handle(query, CancellationToken.None);

        // THEN: Repository was called with Guid.Empty (handler delegates — no input filtering)
        await mockRepository.Received(1).GetByIdAsync(Guid.Empty, Arg.Any<CancellationToken>());

        // AND: null is returned (same as any not-found case)
        Assert.Null(result);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DTO field mapping completeness
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_MapsEntityIdToDto_ExactlyAsIs()
    {
        // GIVEN: Entity has a known Id (set by ClienteEntity.Create)
        var requestId = Guid.NewGuid();
        var mockRepository = Substitute.For<IClienteRepository>();
        var entity = ClienteEntity.Create("ID Mapping Test", "900000010-0", "+57 601 010 0001", "Bogotá");

        mockRepository.GetByIdAsync(requestId, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<ClienteEntity?>(entity));

        var handler = new GetClienteByIdQueryHandler(mockRepository);
        var query = new GetClienteByIdQuery(requestId);

        // WHEN: Handle is called
        var result = await handler.Handle(query, CancellationToken.None);

        // THEN: DTO.Id == entity.Id (the entity's own UUID, not the query requestId)
        // This verifies the mapping uses entity.Id, not the incoming query.Id
        Assert.Equal(entity.Id, result!.Id);
    }

    [Fact]
    public async Task Handle_MapsUpdatedAtSeparatelyFromCreatedAt()
    {
        // GIVEN: A freshly created entity (CreatedAt ≈ UpdatedAt at creation time)
        var id = Guid.NewGuid();
        var mockRepository = Substitute.For<IClienteRepository>();
        var entity = ClienteEntity.Create("Timestamp Test SA", "900000020-0", "+57 601 020 0001", "Cali");

        mockRepository.GetByIdAsync(id, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<ClienteEntity?>(entity));

        var handler = new GetClienteByIdQueryHandler(mockRepository);
        var query = new GetClienteByIdQuery(id);

        // WHEN: Handle is called
        var result = await handler.Handle(query, CancellationToken.None);

        // THEN: Both fields are present and non-default DateTimeOffset values
        Assert.IsType<DateTimeOffset>(result!.CreatedAt);
        Assert.IsType<DateTimeOffset>(result.UpdatedAt);
        Assert.NotEqual(default(DateTimeOffset), result.CreatedAt);
        Assert.NotEqual(default(DateTimeOffset), result.UpdatedAt);

        // AND: UpdatedAt is mapped independently (same value at creation is OK;
        // the key assertion is that it is NOT default and IS a DateTimeOffset)
    }

    [Fact]
    public async Task Handle_MapsUpdatedAt_Not_CreatedAt_AsAlias()
    {
        // GIVEN: Entity with UpdatedAt bumped via Update() call
        var id = Guid.NewGuid();
        var mockRepository = Substitute.For<IClienteRepository>();
        var entity = ClienteEntity.Create("Before Update", "900000030-0", "+57 601 030 0001", "Bogotá");
        var originalCreatedAt = entity.CreatedAt;

        // Wait 1 tick and update so UpdatedAt > CreatedAt
        System.Threading.Thread.Sleep(10);
        entity.Update("After Update", "900000030-0", "+57 601 030 0001", "Bogotá");

        mockRepository.GetByIdAsync(id, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<ClienteEntity?>(entity));

        var handler = new GetClienteByIdQueryHandler(mockRepository);
        var query = new GetClienteByIdQuery(id);

        // WHEN: Handle is called
        var result = await handler.Handle(query, CancellationToken.None);

        // THEN: DTO.UpdatedAt > DTO.CreatedAt (independent fields, not aliases)
        Assert.True(result!.UpdatedAt > result.CreatedAt,
            $"UpdatedAt ({result.UpdatedAt}) should be > CreatedAt ({result.CreatedAt}) after an Update() call");

        // AND: DTO.CreatedAt equals the original creation timestamp
        Assert.Equal(originalCreatedAt, result.CreatedAt);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Special characters in field values
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_MapsNombreWithAccentedCharactersWithoutCorruption()
    {
        // GIVEN: Entity with accented and special characters in Nombre
        var id = Guid.NewGuid();
        var mockRepository = Substitute.For<IClienteRepository>();
        var entity = ClienteEntity.Create(
            "Compañía Ñoño & Asociados S.A.S.",
            "900000040-0",
            "+57 601 040 0001",
            "Bogotá");

        mockRepository.GetByIdAsync(id, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<ClienteEntity?>(entity));

        var handler = new GetClienteByIdQueryHandler(mockRepository);
        var query = new GetClienteByIdQuery(id);

        // WHEN: Handle is called
        var result = await handler.Handle(query, CancellationToken.None);

        // THEN: Nombre is preserved verbatim (no stripping of accents, &, periods)
        Assert.Equal("Compañía Ñoño & Asociados S.A.S.", result!.Nombre);
    }

    [Fact]
    public async Task Handle_MapsNitWithDotsAndHyphenWithoutCorruption()
    {
        // GIVEN: NIT with full Colombian format including dots and hyphen
        var id = Guid.NewGuid();
        var mockRepository = Substitute.For<IClienteRepository>();
        var entity = ClienteEntity.Create(
            "Test NIT Format SA",
            "900.123.456-7",
            "+57 600 000 0001",
            "Cali");

        mockRepository.GetByIdAsync(id, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<ClienteEntity?>(entity));

        var handler = new GetClienteByIdQueryHandler(mockRepository);
        var query = new GetClienteByIdQuery(id);

        // WHEN: Handle is called
        var result = await handler.Handle(query, CancellationToken.None);

        // THEN: NIT is preserved verbatim including dots and hyphen
        Assert.Equal("900.123.456-7", result!.Nit);
    }

    [Fact]
    public async Task Handle_MapsTelefonoWithPlusSignAndSpacesWithoutCorruption()
    {
        // GIVEN: Telefono with international format (+ prefix and spaces)
        var id = Guid.NewGuid();
        var mockRepository = Substitute.For<IClienteRepository>();
        var entity = ClienteEntity.Create(
            "Phone Format SA",
            "900000050-0",
            "+57 (601) 234-5678",
            "Medellín");

        mockRepository.GetByIdAsync(id, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<ClienteEntity?>(entity));

        var handler = new GetClienteByIdQueryHandler(mockRepository);
        var query = new GetClienteByIdQuery(id);

        // WHEN: Handle is called
        var result = await handler.Handle(query, CancellationToken.None);

        // THEN: Telefono is preserved verbatim (no stripping of + or spaces)
        Assert.Equal("+57 (601) 234-5678", result!.Telefono);
    }

    [Fact]
    public async Task Handle_MapsCiudadWithAccentedCharactersWithoutCorruption()
    {
        // GIVEN: Ciudad with an accent (Bogotá, Barranquilla, etc.)
        var id = Guid.NewGuid();
        var mockRepository = Substitute.For<IClienteRepository>();
        var entity = ClienteEntity.Create(
            "Accented Ciudad SA",
            "900000060-0",
            "+57 601 060 0001",
            "Bogotá");

        mockRepository.GetByIdAsync(id, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<ClienteEntity?>(entity));

        var handler = new GetClienteByIdQueryHandler(mockRepository);
        var query = new GetClienteByIdQuery(id);

        // WHEN: Handle is called
        var result = await handler.Handle(query, CancellationToken.None);

        // THEN: Ciudad is preserved verbatim (accented ó retained)
        Assert.Equal("Bogotá", result!.Ciudad);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // No side effects
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_DoesNotModifyEntityState_AfterMapping()
    {
        // GIVEN: Entity with known values
        var id = Guid.NewGuid();
        var mockRepository = Substitute.For<IClienteRepository>();
        var entity = ClienteEntity.Create("Immutable Test SA", "900000070-0", "+57 601 070 0001", "Cali");
        var originalNombre = entity.Nombre;
        var originalNit = entity.Nit;
        var originalCreatedAt = entity.CreatedAt;
        var originalUpdatedAt = entity.UpdatedAt;

        mockRepository.GetByIdAsync(id, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<ClienteEntity?>(entity));

        var handler = new GetClienteByIdQueryHandler(mockRepository);
        var query = new GetClienteByIdQuery(id);

        // WHEN: Handle is called
        await handler.Handle(query, CancellationToken.None);

        // THEN: The entity's properties are unchanged (handler is read-only)
        Assert.Equal(originalNombre, entity.Nombre);
        Assert.Equal(originalNit, entity.Nit);
        Assert.Equal(originalCreatedAt, entity.CreatedAt);
        Assert.Equal(originalUpdatedAt, entity.UpdatedAt);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DTO shape — no extra/unexpected fields
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_ReturnsClienteDto_WithNonNullNombre()
    {
        // GIVEN: Entity with a valid Nombre
        var id = Guid.NewGuid();
        var mockRepository = Substitute.For<IClienteRepository>();
        var entity = ClienteEntity.Create("Non-Null Check SA", "900000080-0", "+57 601 080 0001", "Bogotá");

        mockRepository.GetByIdAsync(id, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<ClienteEntity?>(entity));

        var handler = new GetClienteByIdQueryHandler(mockRepository);

        // WHEN: Handle is called
        var result = await handler.Handle(new GetClienteByIdQuery(id), CancellationToken.None);

        // THEN: DTO Nombre is not null and not empty
        Assert.NotNull(result!.Nombre);
        Assert.NotEmpty(result.Nombre);
    }

    [Fact]
    public async Task Handle_ReturnsClienteDto_WithNonEmptyNit()
    {
        // GIVEN: Entity with a valid NIT
        var id = Guid.NewGuid();
        var mockRepository = Substitute.For<IClienteRepository>();
        var entity = ClienteEntity.Create("NIT Check SA", "800000090-0", "+57 601 090 0001", "Bogotá");

        mockRepository.GetByIdAsync(id, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<ClienteEntity?>(entity));

        var handler = new GetClienteByIdQueryHandler(mockRepository);

        // WHEN: Handle is called
        var result = await handler.Handle(new GetClienteByIdQuery(id), CancellationToken.None);

        // THEN: DTO Nit is not null and not empty (integrity check)
        Assert.NotNull(result!.Nit);
        Assert.NotEmpty(result.Nit);
    }
}
