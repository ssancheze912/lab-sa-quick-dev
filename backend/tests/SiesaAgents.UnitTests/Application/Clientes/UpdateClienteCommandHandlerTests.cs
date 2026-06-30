using Xunit;
using FluentValidation;
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.Validators;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Exceptions;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

public class UpdateClienteCommandHandlerTests
{
    // ─────────────────────────────────────────────────────────────────────
    // Fake repository
    // ─────────────────────────────────────────────────────────────────────

    private sealed class FakeClienteRepository : IClienteRepository
    {
        private readonly List<ClienteEntity> _clientes;
        public ClienteEntity? LastUpdatedEntity { get; private set; }

        public FakeClienteRepository(IEnumerable<ClienteEntity>? existing = null)
        {
            _clientes = existing?.ToList() ?? [];
        }

        public Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult<IEnumerable<ClienteEntity>>(_clientes);

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromResult(_clientes.FirstOrDefault(c => c.Id == id));

        public Task<ClienteEntity> CreateAsync(ClienteEntity cliente, CancellationToken ct)
        {
            _clientes.Add(cliente);
            return Task.FromResult(cliente);
        }

        public Task UpdateAsync(ClienteEntity entity, CancellationToken ct)
        {
            LastUpdatedEntity = entity;
            return Task.CompletedTask;
        }

        public Task<bool> DeleteAsync(Guid id, CancellationToken ct)
            => Task.FromResult(true);

        public Task<bool> ExistsByNitAsync(string nit, CancellationToken ct)
            => Task.FromResult(_clientes.Any(c => c.Nit == nit));
    }

    private static UpdateClienteCommandHandler BuildHandler(FakeClienteRepository repo)
    {
        var validator = new UpdateClienteCommandValidator();
        return new UpdateClienteCommandHandler(repo, validator);
    }

    // ─────────────────────────────────────────────────────────────────────
    // AC2 — Valid input updates entity and returns updated ClienteDto
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_ValidInput_ReturnsClienteDtoWithUpdatedFields()
    {
        // Arrange
        var existing = ClienteEntity.Create("Empresa Original", "900123456-1", "3001234567", "Bogotá");
        var repo = new FakeClienteRepository([existing]);
        var handler = BuildHandler(repo);
        var command = new UpdateClienteCommand(existing.Id, "Empresa Actualizada", "900123456-1", "3009999999", "Medellín");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.Equal(existing.Id, result.Id);
        Assert.Equal("Empresa Actualizada", result.Nombre);
        Assert.Equal("3009999999", result.Telefono);
        Assert.Equal("Medellín", result.Ciudad);
    }

    [Fact]
    public async Task Handle_ValidInput_CallsUpdateAsyncOnRepository()
    {
        // Arrange
        var existing = ClienteEntity.Create("Empresa Original", "900123456-1", "3001234567", "Bogotá");
        var repo = new FakeClienteRepository([existing]);
        var handler = BuildHandler(repo);
        var command = new UpdateClienteCommand(existing.Id, "Empresa Actualizada", "900123456-1", "3009999999", "Medellín");

        // Act
        await handler.Handle(command, CancellationToken.None);

        // Assert: UpdateAsync was called with the entity
        Assert.NotNull(repo.LastUpdatedEntity);
        Assert.Equal(existing.Id, repo.LastUpdatedEntity!.Id);
    }

    [Fact]
    public async Task Handle_ValidInput_UpdatedAtIsSetToCurrentTime()
    {
        // Arrange
        var existing = ClienteEntity.Create("Empresa Original", "900123456-1", "3001234567", "Bogotá");
        var repo = new FakeClienteRepository([existing]);
        var handler = BuildHandler(repo);
        var command = new UpdateClienteCommand(existing.Id, "Empresa Actualizada", "900123456-1", "3009999999", "Medellín");
        var beforeCall = DateTimeOffset.UtcNow.AddSeconds(-1);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);
        var afterCall = DateTimeOffset.UtcNow.AddSeconds(1);

        // Assert: UpdatedAt is within expected time window
        Assert.True(result.UpdatedAt >= beforeCall, "UpdatedAt should be after call started");
        Assert.True(result.UpdatedAt <= afterCall, "UpdatedAt should be before call ended");
    }

    // ─────────────────────────────────────────────────────────────────────
    // AC3 — Validation: empty required fields throw ValidationException
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_EmptyNombre_ThrowsValidationException()
    {
        // Arrange
        var existing = ClienteEntity.Create("Empresa Original", "900123456-1", "3001234567", "Bogotá");
        var repo = new FakeClienteRepository([existing]);
        var handler = BuildHandler(repo);
        var command = new UpdateClienteCommand(existing.Id, "", "900123456-1", "3001234567", "Bogotá");

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(
            () => handler.Handle(command, CancellationToken.None));

        Assert.Contains(ex.Errors, e => e.PropertyName == "Nombre");
    }

    [Fact]
    public async Task Handle_EmptyNit_ThrowsValidationException()
    {
        // Arrange
        var existing = ClienteEntity.Create("Empresa Original", "900123456-1", "3001234567", "Bogotá");
        var repo = new FakeClienteRepository([existing]);
        var handler = BuildHandler(repo);
        var command = new UpdateClienteCommand(existing.Id, "Empresa Original", "", "3001234567", "Bogotá");

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(
            () => handler.Handle(command, CancellationToken.None));

        Assert.Contains(ex.Errors, e => e.PropertyName == "Nit");
    }

    // ─────────────────────────────────────────────────────────────────────
    // AC2 — Non-existent Id throws NotFoundException → 404
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_NonExistentId_ThrowsNotFoundException()
    {
        // Arrange
        var repo = new FakeClienteRepository();
        var handler = BuildHandler(repo);
        var command = new UpdateClienteCommand(Guid.NewGuid(), "Empresa", "900123456-1", "3001234567", "Bogotá");

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(
            () => handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task Handle_NonExistentId_DoesNotCallUpdateAsync()
    {
        // Arrange
        var repo = new FakeClienteRepository();
        var handler = BuildHandler(repo);
        var command = new UpdateClienteCommand(Guid.NewGuid(), "Empresa", "900123456-1", "3001234567", "Bogotá");

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(
            () => handler.Handle(command, CancellationToken.None));

        // UpdateAsync was NOT called
        Assert.Null(repo.LastUpdatedEntity);
    }
}
