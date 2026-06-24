using Microsoft.EntityFrameworkCore;
using SiesaAgents.Application.Contactos.Queries;
using SiesaAgents.Domain.Entities;
using SiesaAgents.Infrastructure.Data;
using SiesaAgents.Infrastructure.Repositories;
using Xunit;

namespace SiesaAgents.UnitTests.Application.Contactos;

public class GetContactosQueryHandlerTests
{
    private static AppDbContext CreateInMemoryContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task HandleAsync_ReturnsEmptyList_WhenNoContactsInDb()
    {
        // Arrange
        await using var context = CreateInMemoryContext(nameof(HandleAsync_ReturnsEmptyList_WhenNoContactsInDb));
        var repository = new ContactoRepository(context);
        var handler = new GetContactosQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetContactosQuery());

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public async Task HandleAsync_ReturnsMappedContactoDtoList_WhenContactsExist()
    {
        // Arrange
        await using var context = CreateInMemoryContext(nameof(HandleAsync_ReturnsMappedContactoDtoList_WhenContactsExist));
        var contacto = ContactoEntity.Create("Juan Pérez", "Gerente", "3001234567", "juan.perez@empresa.com");
        context.Contactos.Add(contacto);
        await context.SaveChangesAsync();

        var repository = new ContactoRepository(context);
        var handler = new GetContactosQueryHandler(repository);

        // Act
        var result = (await handler.HandleAsync(new GetContactosQuery())).ToList();

        // Assert
        Assert.Single(result);
        Assert.Equal("Juan Pérez", result[0].Nombre);
        Assert.Equal("Gerente", result[0].Cargo);
        Assert.Equal("3001234567", result[0].Telefono);
        Assert.Equal("juan.perez@empresa.com", result[0].Email);
        Assert.Null(result[0].ClienteId);
    }

    [Fact]
    public async Task HandleAsync_UsesNoTracking_WhenReturningContacts()
    {
        // Arrange
        await using var context = CreateInMemoryContext(nameof(HandleAsync_UsesNoTracking_WhenReturningContacts));
        var contacto = ContactoEntity.Create("María López", "Directora", "3119876543", "maria.lopez@otra.com");
        context.Contactos.Add(contacto);
        await context.SaveChangesAsync();
        context.ChangeTracker.Clear();

        var repository = new ContactoRepository(context);
        var handler = new GetContactosQueryHandler(repository);

        // Act
        await handler.HandleAsync(new GetContactosQuery());

        // Assert — AsNoTracking means ChangeTracker has no tracked entries
        Assert.Empty(context.ChangeTracker.Entries());
    }
}
