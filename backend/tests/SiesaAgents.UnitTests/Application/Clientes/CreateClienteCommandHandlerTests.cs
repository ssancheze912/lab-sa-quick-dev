using FluentValidation;
using Microsoft.EntityFrameworkCore;
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Interfaces;
using SiesaAgents.Application.Clientes.Validators;
using SiesaAgents.Domain.Entities;
using SiesaAgents.Domain.Exceptions;
using SiesaAgents.Infrastructure.Data;
using SiesaAgents.Infrastructure.Repositories;
using Xunit;

namespace SiesaAgents.UnitTests.Application.Clientes;

public class CreateClienteCommandHandlerTests
{
    private static AppDbContext CreateInMemoryContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task HandleAsync_CreatesClienteAndReturnsDto_WhenCommandIsValid()
    {
        // Arrange
        await using var context = CreateInMemoryContext(nameof(HandleAsync_CreatesClienteAndReturnsDto_WhenCommandIsValid));
        var repository = new ClienteRepository(context);
        var handler = new CreateClienteCommandHandler(repository);
        var command = new CreateClienteCommand("Empresa Alpha", "900123456-1", "3001234567", "Bogotá");

        // Act
        var result = await handler.HandleAsync(command);

        // Assert
        Assert.NotNull(result);
        Assert.IsType<ClienteDto>(result);
        Assert.Equal("Empresa Alpha", result.Nombre);
        Assert.Equal("900123456-1", result.Nit);
        Assert.Equal("3001234567", result.Telefono);
        Assert.Equal("Bogotá", result.Ciudad);
        Assert.NotEqual(default, result.Id);
        Assert.NotEqual(default, result.CreatedAt);
        Assert.NotEqual(default, result.UpdatedAt);
    }

    [Fact]
    public async Task HandleAsync_PersistsClienteToDatabase_WhenCommandIsValid()
    {
        // Arrange
        await using var context = CreateInMemoryContext(nameof(HandleAsync_PersistsClienteToDatabase_WhenCommandIsValid));
        var repository = new ClienteRepository(context);
        var handler = new CreateClienteCommandHandler(repository);
        var command = new CreateClienteCommand("Empresa Beta", "800987654-2", "3119876543", "Medellín");

        // Act
        await handler.HandleAsync(command);

        // Assert — verify entity is actually saved
        var saved = await context.Clientes.FirstOrDefaultAsync(c => c.Nit == "800987654-2");
        Assert.NotNull(saved);
        Assert.Equal("Empresa Beta", saved.Nombre);
        Assert.Equal("3119876543", saved.Telefono);
        Assert.Equal("Medellín", saved.Ciudad);
    }

    [Fact]
    public async Task HandleAsync_ThrowsArgumentException_WhenNombreIsEmpty()
    {
        // Arrange
        await using var context = CreateInMemoryContext(nameof(HandleAsync_ThrowsArgumentException_WhenNombreIsEmpty));
        var repository = new ClienteRepository(context);
        var handler = new CreateClienteCommandHandler(repository);
        var command = new CreateClienteCommand("", "900123456-1", "3001234567", "Bogotá");

        // Act & Assert — ClienteEntity.Create throws ArgumentException for empty nombre
        await Assert.ThrowsAsync<ArgumentException>(
            () => handler.HandleAsync(command));
    }

    // NOTE: EF Core InMemory does not enforce unique constraints, so the ConflictException
    // path (duplicate NIT via uk_clientes_nit) can only be fully verified via integration tests
    // (ClienteEndpointsTests.PostCliente_Returns409Conflict_WhenNitAlreadyExists).
    // This test validates the handler's catch block re-throws as ConflictException when
    // a DbUpdateException containing the constraint name is raised by the repository.
    [Fact]
    public async Task HandleAsync_ThrowsConflictException_WhenDbUpdateExceptionContainsUkClientes()
    {
        // Arrange — use a fake repository that throws DbUpdateException with uk_clientes_nit
        var fakeException = new DbUpdateException(
            "An error occurred while saving the entity changes.",
            new Exception("ERROR: duplicate key value violates unique constraint \"uk_clientes_nit\""));

        var repository = new ThrowingSaveClienteRepository(fakeException);
        var handler = new CreateClienteCommandHandler(repository);
        var command = new CreateClienteCommand("Empresa Dup", "900123456-1", "3001234567", "Bogotá");

        // Act & Assert
        await Assert.ThrowsAsync<ConflictException>(
            () => handler.HandleAsync(command));
    }

    // Helper: IClienteRepository stub that throws on SaveChangesAsync to simulate DB constraint violation
    private sealed class ThrowingSaveClienteRepository(Exception exceptionToThrow) : IClienteRepository
    {
        private ClienteEntity? _added;

        public Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct = default)
            => Task.FromResult(Enumerable.Empty<ClienteEntity>());

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct = default)
            => Task.FromResult<ClienteEntity?>(null);

        public Task AddAsync(ClienteEntity entity, CancellationToken ct = default)
        {
            _added = entity;
            return Task.CompletedTask;
        }

        public Task DeleteAsync(ClienteEntity entity, CancellationToken ct = default)
            => Task.CompletedTask;

        public Task SaveChangesAsync(CancellationToken ct = default)
            => Task.FromException(exceptionToThrow);
    }

    [Fact]
    public void Validator_ReturnsErrors_WhenRequiredFieldsAreEmpty()
    {
        // Arrange
        var validator = new CreateClienteRequestValidator();
        var request = new CreateClienteRequest("", "", "", "");

        // Act
        var result = validator.Validate(request);

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Nombre");
        Assert.Contains(result.Errors, e => e.PropertyName == "Nit");
        Assert.Contains(result.Errors, e => e.PropertyName == "Telefono");
        Assert.Contains(result.Errors, e => e.PropertyName == "Ciudad");
    }

    [Fact]
    public void Validator_ReturnsErrors_WhenFieldsExceedMaxLength()
    {
        // Arrange
        var validator = new CreateClienteRequestValidator();
        var request = new CreateClienteRequest(
            new string('A', 201),  // nombre > 200
            new string('B', 51),   // nit > 50
            new string('C', 31),   // telefono > 30
            new string('D', 101)); // ciudad > 100

        // Act
        var result = validator.Validate(request);

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Nombre");
        Assert.Contains(result.Errors, e => e.PropertyName == "Nit");
        Assert.Contains(result.Errors, e => e.PropertyName == "Telefono");
        Assert.Contains(result.Errors, e => e.PropertyName == "Ciudad");
    }

    [Fact]
    public void Validator_ReturnsNoErrors_WhenAllFieldsAreValid()
    {
        // Arrange
        var validator = new CreateClienteRequestValidator();
        var request = new CreateClienteRequest("Empresa Alpha", "900123456-1", "3001234567", "Bogotá");

        // Act
        var result = validator.Validate(request);

        // Assert
        Assert.True(result.IsValid);
    }
}
