using SiesaAgents.Application.Contactos.Queries;
using SiesaAgents.Domain.Contactos.Entities;
using SiesaAgents.Domain.Contactos.Interfaces;

namespace SiesaAgents.UnitTests.Handlers;

/// <summary>
/// ATDD — Story 3.1: Contact List &amp; Search
/// Unit tests for GetContactosQueryHandler.
///
/// Tests are in RED phase — they define expected behaviour BEFORE implementation.
/// Make these tests GREEN by implementing:
///   SiesaAgents.Domain/Contactos/Entities/ContactoEntity.cs
///   SiesaAgents.Domain/Contactos/Interfaces/IContactoRepository.cs
///   SiesaAgents.Application/Contactos/Queries/GetContactosQuery.cs
///   SiesaAgents.Application/Contactos/Queries/GetContactosQueryHandler.cs
///   SiesaAgents.Application/Contactos/DTOs/ContactoDto.cs
///
/// Coverage:
///   UNIT-B-CT-GET-01 (P1) — Handler returns ContactoDto[] when repository returns data
///   UNIT-B-CT-GET-02 (P1) — Handler returns empty collection when repository has no records
/// </summary>
public class GetContactosQueryHandlerTests
{
    // -------------------------------------------------------------------------
    // UNIT-B-CT-GET-01 (P1 · AC1)
    // Given the IContactoRepository returns a list of ContactoEntity records
    // When HandleAsync is called with GetContactosQuery
    // Then the handler returns a collection of ContactoDto mapped from the entities
    //   AND each DTO contains the correct Nombre, Cargo, Email, and Id values
    // -------------------------------------------------------------------------
    [Fact]
    public async Task HandleAsync_WithContactos_ReturnsMappedDtos()
    {
        // Arrange
        var contactos = new List<ContactoEntity>
        {
            ContactoEntity.Create("María García", "Gerente Comercial", "+57 1 234 5679", "m.garcia@empresa.com"),
            ContactoEntity.Create("Carlos López", "Analista TI", "+57 1 234 5680", "c.lopez@empresa.com"),
        };
        var repository = new FakeContactoRepository(contactos);
        var handler = new GetContactosQueryHandler(repository);

        // Act
        var result = (await handler.HandleAsync(new GetContactosQuery(), CancellationToken.None)).ToList();

        // Assert
        Assert.Equal(2, result.Count);
        Assert.Contains(result, d =>
            d.Nombre == "María García" &&
            d.Cargo == "Gerente Comercial" &&
            d.Email == "m.garcia@empresa.com");
        Assert.Contains(result, d =>
            d.Nombre == "Carlos López" &&
            d.Cargo == "Analista TI" &&
            d.Email == "c.lopez@empresa.com");
    }

    // -------------------------------------------------------------------------
    // UNIT-B-CT-GET-02 (P1 · AC1)
    // Given the IContactoRepository returns an empty collection
    // When HandleAsync is called with GetContactosQuery
    // Then the handler returns an empty collection (not null, not an error)
    // -------------------------------------------------------------------------
    [Fact]
    public async Task HandleAsync_WithNoContactos_ReturnsEmptyCollection()
    {
        // Arrange
        var repository = new FakeContactoRepository(new List<ContactoEntity>());
        var handler = new GetContactosQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetContactosQuery(), CancellationToken.None);

        // Assert
        Assert.Empty(result);
    }

    // -------------------------------------------------------------------------
    // Fake in-memory repository for unit test isolation
    // -------------------------------------------------------------------------
    private sealed class FakeContactoRepository : IContactoRepository
    {
        private readonly IEnumerable<ContactoEntity> _data;

        public FakeContactoRepository(IEnumerable<ContactoEntity> data)
        {
            _data = data;
        }

        public Task<IEnumerable<ContactoEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult(_data);
    }
}
