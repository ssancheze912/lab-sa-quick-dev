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

public class UpdateClienteCommandHandlerTests
{
    private static AppDbContext CreateInMemoryContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task HandleAsync_UpdatesEntityAndReturnsUpdatedDto_WhenCommandIsValid()
    {
        // Arrange
        await using var context = CreateInMemoryContext(nameof(HandleAsync_UpdatesEntityAndReturnsUpdatedDto_WhenCommandIsValid));
        var entity = ClienteEntity.Create("Empresa Original", "900111222-1", "3001110000", "Bogotá");
        context.Clientes.Add(entity);
        await context.SaveChangesAsync();

        var repository = new ClienteRepository(context);
        var handler = new UpdateClienteCommandHandler(repository);
        var command = new UpdateClienteCommand(entity.Id, "Empresa Actualizada", "900111222-1", "3001119999", "Medellín");

        // Act
        var result = await handler.HandleAsync(command);

        // Assert
        Assert.NotNull(result);
        Assert.IsType<ClienteDto>(result);
        Assert.Equal("Empresa Actualizada", result.Nombre);
        Assert.Equal("900111222-1", result.Nit);
        Assert.Equal("3001119999", result.Telefono);
        Assert.Equal("Medellín", result.Ciudad);
        Assert.Equal(entity.Id, result.Id);
        Assert.NotEqual(default, result.UpdatedAt);
    }

    [Fact]
    public async Task HandleAsync_PersistsUpdatedValuesInDatabase()
    {
        // Arrange
        await using var context = CreateInMemoryContext(nameof(HandleAsync_PersistsUpdatedValuesInDatabase));
        var entity = ClienteEntity.Create("Empresa Original", "800222333-2", "3002220000", "Cali");
        context.Clientes.Add(entity);
        await context.SaveChangesAsync();

        var repository = new ClienteRepository(context);
        var handler = new UpdateClienteCommandHandler(repository);
        var command = new UpdateClienteCommand(entity.Id, "Empresa Modificada", "800222333-2", "3002229999", "Barranquilla");

        // Act
        await handler.HandleAsync(command);

        // Assert — reload from context
        var saved = await context.Clientes.FindAsync(entity.Id);
        Assert.NotNull(saved);
        Assert.Equal("Empresa Modificada", saved.Nombre);
        Assert.Equal("3002229999", saved.Telefono);
        Assert.Equal("Barranquilla", saved.Ciudad);
    }

    [Fact]
    public async Task HandleAsync_ThrowsNotFoundException_WhenClientIdNotFound()
    {
        // Arrange
        await using var context = CreateInMemoryContext(nameof(HandleAsync_ThrowsNotFoundException_WhenClientIdNotFound));
        var repository = new ClienteRepository(context);
        var handler = new UpdateClienteCommandHandler(repository);
        var nonExistentId = Guid.NewGuid();
        var command = new UpdateClienteCommand(nonExistentId, "Empresa", "123456789-0", "3001234567", "Bogotá");

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(
            () => handler.HandleAsync(command));
    }

    [Fact]
    public async Task HandleAsync_ThrowsConflictException_WhenDbUpdateExceptionContainsUkClientesNit()
    {
        // Arrange — use a fake repository that throws DbUpdateException with uk_clientes_nit
        var entity = ClienteEntity.Create("Empresa Dup", "900111222-1", "3001110000", "Bogotá");
        var fakeException = new DbUpdateException(
            "An error occurred while saving the entity changes.",
            new Exception("ERROR: duplicate key value violates unique constraint \"uk_clientes_nit\""));

        var repository = new ThrowingUpdateClienteRepository(entity, fakeException);
        var handler = new UpdateClienteCommandHandler(repository);
        var command = new UpdateClienteCommand(entity.Id, "Empresa Dup Modified", "900111222-1", "3001110001", "Cali");

        // Act & Assert
        await Assert.ThrowsAsync<ConflictException>(
            () => handler.HandleAsync(command));
    }

    [Fact]
    public void Validator_ReturnsErrors_WhenRequiredFieldsAreEmpty()
    {
        // Arrange
        var validator = new UpdateClienteRequestValidator();
        var request = new UpdateClienteRequest("", "", "", "");

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
        var validator = new UpdateClienteRequestValidator();
        var request = new UpdateClienteRequest(
            new string('A', 201),
            new string('B', 51),
            new string('C', 31),
            new string('D', 101));

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
        var validator = new UpdateClienteRequestValidator();
        var request = new UpdateClienteRequest("Empresa Alpha", "900123456-1", "3001234567", "Bogotá");

        // Act
        var result = validator.Validate(request);

        // Assert
        Assert.True(result.IsValid);
    }

    // Helper: IClienteRepository stub that returns a specific entity and throws on SaveChangesAsync
    private sealed class ThrowingUpdateClienteRepository(ClienteEntity entityToReturn, Exception exceptionToThrow) : IClienteRepository
    {
        public Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct = default)
            => Task.FromResult(Enumerable.Empty<ClienteEntity>());

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct = default)
            => Task.FromResult<ClienteEntity?>(entityToReturn);

        public Task AddAsync(ClienteEntity entity, CancellationToken ct = default)
            => Task.CompletedTask;

        public Task SaveChangesAsync(CancellationToken ct = default)
            => Task.FromException(exceptionToThrow);
    }
}
