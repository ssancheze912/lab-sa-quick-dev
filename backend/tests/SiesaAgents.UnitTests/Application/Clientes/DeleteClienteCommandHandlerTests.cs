using Microsoft.EntityFrameworkCore;
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.Interfaces;
using SiesaAgents.Domain.Entities;
using SiesaAgents.Domain.Exceptions;
using SiesaAgents.Infrastructure.Data;
using SiesaAgents.Infrastructure.Repositories;
using Xunit;

namespace SiesaAgents.UnitTests.Application.Clientes;

public class DeleteClienteCommandHandlerTests
{
    private static AppDbContext CreateInMemoryContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task HandleAsync_DeletesEntitySuccessfully_WhenClientExists()
    {
        // Arrange
        await using var context = CreateInMemoryContext(nameof(HandleAsync_DeletesEntitySuccessfully_WhenClientExists));
        var entity = ClienteEntity.Create("Empresa Test", "900111222-1", "3001110000", "Bogotá");
        context.Clientes.Add(entity);
        await context.SaveChangesAsync();

        var repository = new ClienteRepository(context);
        var handler = new DeleteClienteCommandHandler(repository);
        var command = new DeleteClienteCommand(entity.Id);

        // Act
        await handler.HandleAsync(command);

        // Assert — entity no longer exists in the context
        var deleted = await context.Clientes.FindAsync(entity.Id);
        Assert.Null(deleted);
    }

    [Fact]
    public async Task HandleAsync_CallsDeleteAsyncAndSaveChangesAsync_WhenClientExists()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa Track", "800222333-2", "3002220000", "Cali");
        var trackingRepository = new TrackingDeleteRepository(entity);
        var handler = new DeleteClienteCommandHandler(trackingRepository);
        var command = new DeleteClienteCommand(entity.Id);

        // Act
        await handler.HandleAsync(command);

        // Assert
        Assert.True(trackingRepository.DeleteAsyncCalled);
        Assert.True(trackingRepository.SaveChangesAsyncCalled);
    }

    [Fact]
    public async Task HandleAsync_ThrowsNotFoundException_WhenClientIdDoesNotExist()
    {
        // Arrange
        await using var context = CreateInMemoryContext(nameof(HandleAsync_ThrowsNotFoundException_WhenClientIdDoesNotExist));
        var repository = new ClienteRepository(context);
        var handler = new DeleteClienteCommandHandler(repository);
        var nonExistentId = Guid.NewGuid();
        var command = new DeleteClienteCommand(nonExistentId);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(
            () => handler.HandleAsync(command));
    }

    // Helper: IClienteRepository stub that tracks calls to DeleteAsync and SaveChangesAsync
    private sealed class TrackingDeleteRepository(ClienteEntity entityToReturn) : IClienteRepository
    {
        public bool DeleteAsyncCalled { get; private set; }
        public bool SaveChangesAsyncCalled { get; private set; }

        public Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct = default)
            => Task.FromResult(Enumerable.Empty<ClienteEntity>());

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct = default)
            => Task.FromResult<ClienteEntity?>(id == entityToReturn.Id ? entityToReturn : null);

        public Task AddAsync(ClienteEntity entity, CancellationToken ct = default)
            => Task.CompletedTask;

        public Task DeleteAsync(ClienteEntity entity, CancellationToken ct = default)
        {
            DeleteAsyncCalled = true;
            return Task.CompletedTask;
        }

        public Task SaveChangesAsync(CancellationToken ct = default)
        {
            SaveChangesAsyncCalled = true;
            return Task.CompletedTask;
        }
    }
}
