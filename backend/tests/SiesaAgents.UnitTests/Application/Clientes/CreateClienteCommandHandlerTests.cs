using Xunit;
using FluentValidation;
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.Validators;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Exceptions;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

public class CreateClienteCommandHandlerTests
{
    // ─────────────────────────────────────────────────────────────────────
    // Fake repository
    // ─────────────────────────────────────────────────────────────────────

    private sealed class FakeClienteRepository : IClienteRepository
    {
        private readonly List<ClienteEntity> _clientes;

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
            => Task.CompletedTask;

        public Task<bool> DeleteAsync(Guid id, CancellationToken ct)
            => Task.FromResult(true);

        public Task<bool> ExistsByNitAsync(string nit, CancellationToken ct)
            => Task.FromResult(_clientes.Any(c => c.Nit == nit));
    }

    private static CreateClienteCommandHandler BuildHandler(FakeClienteRepository? repo = null)
    {
        var repository = repo ?? new FakeClienteRepository();
        var validator = new CreateClienteCommandValidator();
        return new CreateClienteCommandHandler(repository, validator);
    }

    // ─────────────────────────────────────────────────────────────────────
    // AC2 — Valid input creates entity and returns ClienteDto
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_ValidInput_ReturnsClienteDtoWithCorrectFields()
    {
        // Arrange
        var handler = BuildHandler();
        var command = new CreateClienteCommand("Empresa Test", "900123456-1", "3001234567", "Bogotá");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotEqual(Guid.Empty, result.Id);
        Assert.Equal("Empresa Test", result.Nombre);
        Assert.Equal("900123456-1", result.Nit);
        Assert.Equal("3001234567", result.Telefono);
        Assert.Equal("Bogotá", result.Ciudad);
        Assert.IsType<DateTimeOffset>(result.CreatedAt);
        Assert.IsType<DateTimeOffset>(result.UpdatedAt);
    }

    // ─────────────────────────────────────────────────────────────────────
    // AC3 — FluentValidation: empty required fields throw ValidationException
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_EmptyNombre_ThrowsValidationException()
    {
        // Arrange
        var handler = BuildHandler();
        var command = new CreateClienteCommand("", "900123456-1", "3001234567", "Bogotá");

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(
            () => handler.Handle(command, CancellationToken.None));

        Assert.Contains(ex.Errors, e => e.PropertyName == "Nombre");
    }

    [Fact]
    public async Task Handle_EmptyNit_ThrowsValidationException()
    {
        // Arrange
        var handler = BuildHandler();
        var command = new CreateClienteCommand("Empresa Test", "", "3001234567", "Bogotá");

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(
            () => handler.Handle(command, CancellationToken.None));

        Assert.Contains(ex.Errors, e => e.PropertyName == "Nit");
    }

    [Fact]
    public async Task Handle_EmptyTelefono_ThrowsValidationException()
    {
        // Arrange
        var handler = BuildHandler();
        var command = new CreateClienteCommand("Empresa Test", "900123456-1", "", "Bogotá");

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(
            () => handler.Handle(command, CancellationToken.None));

        Assert.Contains(ex.Errors, e => e.PropertyName == "Telefono");
    }

    [Fact]
    public async Task Handle_EmptyCiudad_ThrowsValidationException()
    {
        // Arrange
        var handler = BuildHandler();
        var command = new CreateClienteCommand("Empresa Test", "900123456-1", "3001234567", "");

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(
            () => handler.Handle(command, CancellationToken.None));

        Assert.Contains(ex.Errors, e => e.PropertyName == "Ciudad");
    }

    // ─────────────────────────────────────────────────────────────────────
    // AC4 — Duplicate NIT throws ConflictException (→ 409 in middleware)
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_DuplicateNit_ThrowsConflictException()
    {
        // Arrange: pre-seed repository with an existing NIT
        var existing = ClienteEntity.Create("Empresa Existente", "900123456-1", "3000000000", "Cali");
        var repo = new FakeClienteRepository([existing]);
        var handler = BuildHandler(repo);
        var command = new CreateClienteCommand("Empresa Nueva", "900123456-1", "3001234567", "Bogotá");

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ConflictException>(
            () => handler.Handle(command, CancellationToken.None));

        Assert.Equal("El NIT/RUC ya está registrado", ex.Message);
    }

    [Fact]
    public async Task Handle_DuplicateNit_DoesNotPersistEntity()
    {
        // Arrange
        var existing = ClienteEntity.Create("Empresa Existente", "900123456-1", "3000000000", "Cali");
        var repo = new FakeClienteRepository([existing]);
        var handler = BuildHandler(repo);
        var command = new CreateClienteCommand("Empresa Nueva", "900123456-1", "3001234567", "Bogotá");

        // Act & Assert — ensure no second entity was stored
        await Assert.ThrowsAsync<ConflictException>(
            () => handler.Handle(command, CancellationToken.None));

        var all = await repo.GetAllAsync(CancellationToken.None);
        Assert.Single(all);
    }
}
