using FluentAssertions;
using SiesaAgents.Application.Contactos.DTOs;
using SiesaAgents.Application.Contactos.Queries;
using SiesaAgents.Domain.Contactos.Entities;
using SiesaAgents.Domain.Contactos.Interfaces;
using Xunit;

namespace SiesaAgents.UnitTests.Application.Contactos;

// ─── Edge-case tests for GetContactosQueryHandler ─────────────────────────────
// Complements GetContactosQueryHandlerTests.cs with boundary conditions,
// DTO field coverage, multiple contacts, and entity validation paths.

// Fake repository reused from the same test assembly
file sealed class FakeContactoEdgeRepository(IEnumerable<ContactoEntity>? items = null, Exception? throws = null) : IContactoRepository
{
    private readonly IEnumerable<ContactoEntity> _items = items ?? [];
    private readonly Exception? _throws = throws;

    public Task<IEnumerable<ContactoEntity>> GetAllAsync()
    {
        if (_throws is not null) throw _throws;
        return Task.FromResult(_items);
    }

    public Task<ContactoEntity?> GetByIdAsync(Guid id)
        => Task.FromResult(_items.FirstOrDefault(e => e.Id == id));
}

public class GetContactosQueryHandlerEdgeCaseTests
{
    private static ContactoEntity MakeContacto(
        string nombre = "Contacto Test",
        string cargo = "Cargo Test",
        string telefono = "3001234567",
        string email = "test@test.com",
        Guid? clienteId = null)
        => ContactoEntity.Create(nombre, cargo, telefono, email, clienteId);

    // ─── Multiple contacts ────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_WhenMultipleContactsExist_ReturnsAllMapped()
    {
        // Arrange
        var c1 = MakeContacto("Primero", email: "primero@test.com");
        var c2 = MakeContacto("Segundo", email: "segundo@test.com");
        var c3 = MakeContacto("Tercero", email: "tercero@test.com");
        var handler = new GetContactosQueryHandler(new FakeContactoEdgeRepository([c1, c2, c3]));

        // Act
        var result = (await handler.HandleAsync(new GetContactosQuery())).ToList();

        // Assert
        result.Should().HaveCount(3);
        result.Select(r => r.Nombre).Should().Contain(["Primero", "Segundo", "Tercero"]);
    }

    // ─── DTO field coverage: non-null ClienteId ───────────────────────────────

    [Fact]
    public async Task HandleAsync_WhenContactHasNonNullClienteId_MapsDtoClienteIdCorrectly()
    {
        // Arrange
        var clienteId = Guid.NewGuid();
        var contacto = MakeContacto("Vinculado", email: "vinculado@test.com", clienteId: clienteId);
        var handler = new GetContactosQueryHandler(new FakeContactoEdgeRepository([contacto]));

        // Act
        var result = await handler.HandleAsync(new GetContactosQuery());

        // Assert
        var dto = result.Should().ContainSingle().Subject;
        dto.ClienteId.Should().Be(clienteId);
    }

    // ─── DTO field coverage: null ClienteId (orphan contact) ─────────────────

    [Fact]
    public async Task HandleAsync_WhenContactHasNullClienteId_MapsDtoClienteIdAsNull()
    {
        // Arrange
        var contacto = MakeContacto("Huérfano", email: "huerfano@test.com", clienteId: null);
        var handler = new GetContactosQueryHandler(new FakeContactoEdgeRepository([contacto]));

        // Act
        var result = await handler.HandleAsync(new GetContactosQuery());

        // Assert
        var dto = result.Should().ContainSingle().Subject;
        dto.ClienteId.Should().BeNull();
    }

    // ─── DTO field coverage: complete record fields ───────────────────────────

    [Fact]
    public async Task HandleAsync_MapsAllDtoFieldsFromEntity()
    {
        // Arrange
        var contacto = MakeContacto("Juan Pérez", "Gerente", "3001234567", "juan@test.com");
        var handler = new GetContactosQueryHandler(new FakeContactoEdgeRepository([contacto]));

        // Act
        var result = await handler.HandleAsync(new GetContactosQuery());

        // Assert: every field of ContactoDto is populated from the entity
        var dto = result.Should().ContainSingle().Subject;
        dto.Id.Should().Be(contacto.Id);
        dto.Nombre.Should().Be("Juan Pérez");
        dto.Cargo.Should().Be("Gerente");
        dto.Telefono.Should().Be("3001234567");
        dto.Email.Should().Be("juan@test.com");
        dto.CreatedAt.Should().Be(contacto.CreatedAt);
        dto.UpdatedAt.Should().Be(contacto.UpdatedAt);
        dto.CreatedAt.Offset.Should().Be(TimeSpan.Zero); // DateTimeOffset UTC
        dto.UpdatedAt.Offset.Should().Be(TimeSpan.Zero);
    }

    // ─── Entity validation: ContactoEntity.Create ────────────────────────────

    [Theory]
    [InlineData("", "Cargo", "3001234567", "email@test.com")]
    [InlineData("  ", "Cargo", "3001234567", "email@test.com")]
    public void ContactoEntityCreate_WhenNombreIsNullOrWhitespace_ThrowsArgumentException(
        string nombre, string cargo, string telefono, string email)
    {
        // Act
        Action act = () => ContactoEntity.Create(nombre, cargo, telefono, email);

        // Assert
        act.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData("Nombre", "", "3001234567", "email@test.com")]
    [InlineData("Nombre", "  ", "3001234567", "email@test.com")]
    public void ContactoEntityCreate_WhenCargoIsNullOrWhitespace_ThrowsArgumentException(
        string nombre, string cargo, string telefono, string email)
    {
        // Act
        Action act = () => ContactoEntity.Create(nombre, cargo, telefono, email);

        // Assert
        act.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData("Nombre", "Cargo", "", "email@test.com")]
    [InlineData("Nombre", "Cargo", "  ", "email@test.com")]
    public void ContactoEntityCreate_WhenTelefonoIsNullOrWhitespace_ThrowsArgumentException(
        string nombre, string cargo, string telefono, string email)
    {
        // Act
        Action act = () => ContactoEntity.Create(nombre, cargo, telefono, email);

        // Assert
        act.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData("Nombre", "Cargo", "3001234567", "")]
    [InlineData("Nombre", "Cargo", "3001234567", "  ")]
    public void ContactoEntityCreate_WhenEmailIsNullOrWhitespace_ThrowsArgumentException(
        string nombre, string cargo, string telefono, string email)
    {
        // Act
        Action act = () => ContactoEntity.Create(nombre, cargo, telefono, email);

        // Assert
        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void ContactoEntityCreate_WithValidArguments_SetsAllFields()
    {
        // Act
        var entity = ContactoEntity.Create("Ana Torres", "Directora", "3107654321", "ana@empresa.com");

        // Assert
        entity.Id.Should().NotBeEmpty();
        entity.Nombre.Should().Be("Ana Torres");
        entity.Cargo.Should().Be("Directora");
        entity.Telefono.Should().Be("3107654321");
        entity.Email.Should().Be("ana@empresa.com");
        entity.ClienteId.Should().BeNull();
        entity.CreatedAt.Should().BeCloseTo(DateTimeOffset.UtcNow, precision: TimeSpan.FromSeconds(5));
        entity.UpdatedAt.Should().BeCloseTo(DateTimeOffset.UtcNow, precision: TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void ContactoEntityCreate_WithClienteId_AssignsClienteId()
    {
        // Arrange
        var clienteId = Guid.NewGuid();

        // Act
        var entity = ContactoEntity.Create("Carlos Ruiz", "Analista", "3001234567", "carlos@test.com", clienteId);

        // Assert
        entity.ClienteId.Should().Be(clienteId);
    }

    [Fact]
    public void ContactoEntityCreate_EachCallGeneratesUniqueId()
    {
        // Act
        var e1 = ContactoEntity.Create("Uno", "Cargo", "3001234567", "uno@test.com");
        var e2 = ContactoEntity.Create("Dos", "Cargo", "3001234567", "dos@test.com");

        // Assert
        e1.Id.Should().NotBe(e2.Id);
    }

    // ─── Ordering: large set of contacts ──────────────────────────────────────

    [Fact]
    public async Task HandleAsync_WithManyContacts_ReturnsAllOrderedByCreatedAtDescending()
    {
        // Arrange: create 10 contacts (all with the same-millisecond timestamp is acceptable;
        // the assertion verifies descending order, not uniqueness of timestamps)
        var contacts = Enumerable.Range(1, 10)
            .Select(i => MakeContacto($"Contacto {i}", email: $"c{i}@test.com"))
            .ToList();

        var handler = new GetContactosQueryHandler(new FakeContactoEdgeRepository(contacts));

        // Act
        var result = (await handler.HandleAsync(new GetContactosQuery())).ToList();

        // Assert: descending order (each item's CreatedAt >= next item's CreatedAt)
        result.Should().HaveCount(10);
        for (var i = 0; i < result.Count - 1; i++)
        {
            result[i].CreatedAt.Should().BeOnOrAfter(result[i + 1].CreatedAt);
        }
    }

    // ─── Repository exception types ───────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_WhenRepositoryThrowsDbException_PropagatesException()
    {
        // Arrange: simulate a typical DB/connection exception type
        var repository = new FakeContactoEdgeRepository(throws: new TimeoutException("DB timeout"));
        var handler = new GetContactosQueryHandler(repository);

        // Act
        Func<Task> act = () => handler.HandleAsync(new GetContactosQuery());

        // Assert
        await act.Should().ThrowAsync<TimeoutException>().WithMessage("DB timeout");
    }
}
