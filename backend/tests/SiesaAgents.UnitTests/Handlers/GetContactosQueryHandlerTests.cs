using SiesaAgents.Application.Contactos.Queries;
using SiesaAgents.Domain.Contactos.Entities;
using SiesaAgents.Domain.Contactos.Interfaces;

namespace SiesaAgents.UnitTests.Handlers;

public class GetContactosQueryHandlerTests
{
    // UNIT-B-CT-GET-01: Handler returns all contacts as ContactoDto[] when repository returns data
    [Fact]
    public async Task HandleAsync_WithContactos_ReturnsMappedDtos()
    {
        // Arrange
        var contactos = new List<ContactoEntity>
        {
            ContactoEntity.Create("María García", "Gerente Comercial", "+57 1 234 5679", "m.garcia@empresa.com"),
            ContactoEntity.Create("Juan Pérez", "Analista", "+57 1 234 5680", "j.perez@empresa.com"),
        };
        var repository = new FakeContactoRepository(contactos);
        var handler = new GetContactosQueryHandler(repository);

        // Act
        var result = (await handler.HandleAsync(new GetContactosQuery(), CancellationToken.None)).ToList();

        // Assert
        Assert.Equal(2, result.Count);
        Assert.Contains(result, d => d.Nombre == "María García" && d.Email == "m.garcia@empresa.com");
        Assert.Contains(result, d => d.Nombre == "Juan Pérez" && d.Email == "j.perez@empresa.com");
    }

    // UNIT-B-CT-GET-02: Handler returns empty array when repository returns no records
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
