using FluentAssertions;
using SiesaAgents.Application.Contactos.DTOs;
using SiesaAgents.Application.Contactos.Queries;
using SiesaAgents.Domain.Contactos.Entities;
using SiesaAgents.Domain.Contactos.Interfaces;
using Xunit;

namespace SiesaAgents.UnitTests.Application.Contactos;

// ─── Fake Repository ──────────────────────────────────────────────────────────

file sealed class FakeContactoRepository(IEnumerable<ContactoEntity>? items = null, Exception? throws = null) : IContactoRepository
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

// ─── Tests ────────────────────────────────────────────────────────────────────

public class GetContactosQueryHandlerTests
{
    private static ContactoEntity MakeContacto(string nombre = "Juan Pérez", string email = "juan@test.com")
        => ContactoEntity.Create(nombre, "Gerente", "3001234567", email);

    [Fact]
    public async Task HandleAsync_WhenNoContacts_ReturnsEmptyList()
    {
        // Arrange
        var handler = new GetContactosQueryHandler(new FakeContactoRepository());

        // Act
        var result = await handler.HandleAsync(new GetContactosQuery());

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task HandleAsync_WhenContactsExist_ReturnsMappedContactoDtos()
    {
        // Arrange
        var contacto = MakeContacto("María García", "m.garcia@test.com");
        var handler = new GetContactosQueryHandler(new FakeContactoRepository([contacto]));

        // Act
        var result = await handler.HandleAsync(new GetContactosQuery());

        // Assert
        var dto = result.Should().ContainSingle().Subject;
        dto.Should().BeOfType<ContactoDto>();
        dto.Id.Should().Be(contacto.Id);
        dto.Nombre.Should().Be("María García");
        dto.Email.Should().Be("m.garcia@test.com");
        dto.Cargo.Should().Be("Gerente");
        dto.Telefono.Should().Be("3001234567");
        dto.ClienteId.Should().BeNull();
        dto.CreatedAt.Should().Be(contacto.CreatedAt);
        dto.UpdatedAt.Should().Be(contacto.UpdatedAt);
    }

    [Fact]
    public async Task HandleAsync_ReturnsContactsOrderedByCreatedAtDescending()
    {
        // Arrange — create two contacts; ordering may be same-millisecond
        var older = MakeContacto("Contacto Antiguo", "antiguo@test.com");
        var newer = MakeContacto("Contacto Nuevo", "nuevo@test.com");

        var handler = new GetContactosQueryHandler(new FakeContactoRepository([older, newer]));

        // Act
        var result = (await handler.HandleAsync(new GetContactosQuery())).ToList();

        // Assert
        result.Should().HaveCount(2);
        result[0].CreatedAt.Should().BeOnOrAfter(result[1].CreatedAt);
    }

    [Fact]
    public async Task HandleAsync_WhenRepositoryThrows_PropagatesException()
    {
        // Arrange
        var repository = new FakeContactoRepository(throws: new InvalidOperationException("DB connection failed"));
        var handler = new GetContactosQueryHandler(repository);

        // Act
        Func<Task> act = () => handler.HandleAsync(new GetContactosQuery());

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("DB connection failed");
    }
}
