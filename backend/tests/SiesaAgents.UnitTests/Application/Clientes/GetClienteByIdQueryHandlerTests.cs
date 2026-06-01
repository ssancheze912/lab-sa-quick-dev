// Story 2.2: Client Detail View
// Epic 2: Client Management
//
// Backend Unit Tests — RED Phase
// These tests are intentionally FAILING until GetClienteByIdQueryHandler is implemented.
//
// Acceptance Criteria covered:
//   AC7 — GetClienteByIdQueryHandler: returns correct ClienteDto for an existing UUID
//   AC7 — GetClienteByIdQueryHandler: returns null for an unknown UUID
//   AC7 — GetClienteByIdQueryHandler: maps all fields (Id, Nombre, Nit, Telefono, Ciudad, CreatedAt, UpdatedAt)

using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

// ─── Tests ───────────────────────────────────────────────────────────────────

public class GetClienteByIdQueryHandlerTests
{
    // NOTE: FakeClienteRepository is defined in GetClientesQueryHandlerTests.cs
    // and is accessible within this namespace.

    // ─────────────────────────────────────────────────────────────────────────
    // AC7 — Handler exists and returns ClienteDto for an existing UUID
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_ExistingId_ReturnsMappedClienteDto()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa ABC", "900123456-1", "3001234567", "Bogotá");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClienteByIdQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClienteByIdQuery(entity.Id), CancellationToken.None);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task HandleAsync_ExistingId_MapsNombreCorrectly()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa ABC", "900123456-1", "3001234567", "Bogotá");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClienteByIdQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClienteByIdQuery(entity.Id), CancellationToken.None);

        // Assert
        Assert.Equal("Empresa ABC", result!.Nombre);
    }

    [Fact]
    public async Task HandleAsync_ExistingId_MapsNitCorrectly()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa ABC", "900123456-1", "3001234567", "Bogotá");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClienteByIdQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClienteByIdQuery(entity.Id), CancellationToken.None);

        // Assert
        Assert.Equal("900123456-1", result!.Nit);
    }

    [Fact]
    public async Task HandleAsync_ExistingId_MapsTelefonoAndCiudadCorrectly()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa ABC", "900123456-1", "3001234567", "Bogotá");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClienteByIdQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClienteByIdQuery(entity.Id), CancellationToken.None);

        // Assert
        Assert.Equal("3001234567", result!.Telefono);
        Assert.Equal("Bogotá", result!.Ciudad);
    }

    [Fact]
    public async Task HandleAsync_ExistingId_MapsIdCorrectly()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa ABC", "900123456-1", "3001234567", "Bogotá");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClienteByIdQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClienteByIdQuery(entity.Id), CancellationToken.None);

        // Assert
        Assert.Equal(entity.Id, result!.Id);
    }

    [Fact]
    public async Task HandleAsync_ExistingId_MapsDateTimeOffsetTimestamps()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa ABC", "900123456-1", "3001234567", "Bogotá");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClienteByIdQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClienteByIdQuery(entity.Id), CancellationToken.None);

        // Assert: timestamps must be DateTimeOffset (not DateTime) per architecture standard
        Assert.IsType<DateTimeOffset>(result!.CreatedAt);
        Assert.IsType<DateTimeOffset>(result!.UpdatedAt);
    }

    [Fact]
    public async Task HandleAsync_ExistingId_ReturnTypeIsClienteDto()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa ABC", "900123456-1", "3001234567", "Bogotá");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClienteByIdQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClienteByIdQuery(entity.Id), CancellationToken.None);

        // Assert: return type is ClienteDto
        Assert.IsType<ClienteDto>(result);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC7 — Handler returns null for an unknown UUID (not-found pattern)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_UnknownId_ReturnsNull()
    {
        // Arrange
        var repository = new FakeClienteRepository([]);
        var handler = new GetClienteByIdQueryHandler(repository);
        var unknownId = Guid.NewGuid();

        // Act
        var result = await handler.HandleAsync(new GetClienteByIdQuery(unknownId), CancellationToken.None);

        // Assert: handler returns null when entity is not found (endpoint maps to HTTP 404)
        Assert.Null(result);
    }

    [Fact]
    public async Task HandleAsync_UnknownId_ReturnsNullNotClienteDtoOfOtherEntity()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa Existente", "900123456-1", "3001234567", "Bogotá");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClienteByIdQueryHandler(repository);
        var unknownId = Guid.NewGuid(); // A different UUID from the existing entity

        // Act
        var result = await handler.HandleAsync(new GetClienteByIdQuery(unknownId), CancellationToken.None);

        // Assert: returns null — does not accidentally return the other entity
        Assert.Null(result);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC7 — Query record contract
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void GetClienteByIdQuery_ShouldHaveGuidIdProperty()
    {
        // Arrange & Act
        var query = new GetClienteByIdQuery(Guid.NewGuid());

        // Assert: query record has an Id property of type Guid
        Assert.IsType<Guid>(query.Id);
    }

    [Fact]
    public void GetClienteByIdQuery_IdShouldMatchConstructorArgument()
    {
        // Arrange
        var expectedId = Guid.NewGuid();

        // Act
        var query = new GetClienteByIdQuery(expectedId);

        // Assert
        Assert.Equal(expectedId, query.Id);
    }
}
