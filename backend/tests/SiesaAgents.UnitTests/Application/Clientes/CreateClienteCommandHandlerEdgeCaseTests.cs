using Xunit;
using FluentValidation;
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.Validators;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Exceptions;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Edge-case tests for CreateClienteCommandHandler expanding beyond the primary ATDD set.
///
/// Primary tests cover: valid input returns DTO, empty Nombre/Nit/Telefono/Ciudad throw ValidationException,
/// duplicate NIT throws ConflictException, duplicate NIT does NOT persist.
///
/// This file covers:
///   - Whitespace-only fields: FluentValidation NotEmpty() rejects whitespace
///   - All four fields empty at once: all 4 validation errors returned
///   - Cancellation token is forwarded to repository methods
///   - UUID is generated (not Guid.Empty) on valid create
///   - CreatedAt and UpdatedAt are set to approximately UtcNow
///   - Multiple validation errors on same request are all returned
///   - NIT comparison is exact (pre-check ExistsByNitAsync with exact NIT)
/// </summary>
public class CreateClienteCommandHandlerEdgeCaseTests
{
    // ─────────────────────────────────────────────────────────────────────
    // Fake repository — tracks received cancellation tokens
    // ─────────────────────────────────────────────────────────────────────

    private sealed class FakeClienteRepository : IClienteRepository
    {
        private readonly List<ClienteEntity> _clientes;
        public CancellationToken LastCancellationToken { get; private set; }

        public FakeClienteRepository(IEnumerable<ClienteEntity>? existing = null)
        {
            _clientes = existing?.ToList() ?? [];
        }

        public Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)
        {
            LastCancellationToken = ct;
            return Task.FromResult<IEnumerable<ClienteEntity>>(_clientes);
        }

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
        {
            LastCancellationToken = ct;
            return Task.FromResult(_clientes.FirstOrDefault(c => c.Id == id));
        }

        public Task<ClienteEntity> CreateAsync(ClienteEntity cliente, CancellationToken ct)
        {
            LastCancellationToken = ct;
            _clientes.Add(cliente);
            return Task.FromResult(cliente);
        }

        public Task UpdateAsync(ClienteEntity entity, CancellationToken ct)
        {
            LastCancellationToken = ct;
            return Task.CompletedTask;
        }

        public Task<bool> DeleteAsync(Guid id, CancellationToken ct)
        {
            LastCancellationToken = ct;
            return Task.FromResult(true);
        }

        public Task<bool> ExistsByNitAsync(string nit, CancellationToken ct)
        {
            LastCancellationToken = ct;
            return Task.FromResult(_clientes.Any(c => c.Nit == nit));
        }
    }

    private static CreateClienteCommandHandler BuildHandler(FakeClienteRepository? repo = null)
    {
        var repository = repo ?? new FakeClienteRepository();
        var validator = new CreateClienteCommandValidator();
        return new CreateClienteCommandHandler(repository, validator);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Whitespace-only fields — FluentValidation NotEmpty() rejects whitespace
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_WhitespaceOnlyNombre_ThrowsValidationException()
    {
        // Arrange: FluentValidation NotEmpty() treats whitespace-only as empty
        var handler = BuildHandler();
        var command = new CreateClienteCommand("   ", "900123456-1", "3001234567", "Bogotá");

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(
            () => handler.Handle(command, CancellationToken.None));

        Assert.Contains(ex.Errors, e => e.PropertyName == "Nombre");
    }

    [Fact]
    public async Task Handle_WhitespaceOnlyNit_ThrowsValidationException()
    {
        // Arrange
        var handler = BuildHandler();
        var command = new CreateClienteCommand("Empresa Test", "   ", "3001234567", "Bogotá");

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(
            () => handler.Handle(command, CancellationToken.None));

        Assert.Contains(ex.Errors, e => e.PropertyName == "Nit");
    }

    [Fact]
    public async Task Handle_WhitespaceOnlyTelefono_ThrowsValidationException()
    {
        // Arrange
        var handler = BuildHandler();
        var command = new CreateClienteCommand("Empresa Test", "900123456-1", "\t", "Bogotá");

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(
            () => handler.Handle(command, CancellationToken.None));

        Assert.Contains(ex.Errors, e => e.PropertyName == "Telefono");
    }

    [Fact]
    public async Task Handle_WhitespaceOnlyCiudad_ThrowsValidationException()
    {
        // Arrange
        var handler = BuildHandler();
        var command = new CreateClienteCommand("Empresa Test", "900123456-1", "3001234567", " ");

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(
            () => handler.Handle(command, CancellationToken.None));

        Assert.Contains(ex.Errors, e => e.PropertyName == "Ciudad");
    }

    // ─────────────────────────────────────────────────────────────────────
    // All fields empty — all 4 validation errors returned
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_AllFieldsEmpty_ThrowsValidationExceptionWithAllFourErrors()
    {
        // Arrange
        var handler = BuildHandler();
        var command = new CreateClienteCommand("", "", "", "");

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(
            () => handler.Handle(command, CancellationToken.None));

        var errorProperties = ex.Errors.Select(e => e.PropertyName).ToList();
        Assert.Contains("Nombre", errorProperties);
        Assert.Contains("Nit", errorProperties);
        Assert.Contains("Telefono", errorProperties);
        Assert.Contains("Ciudad", errorProperties);
    }

    [Fact]
    public async Task Handle_AllFieldsEmpty_ThrowsValidationExceptionWithAtLeastFourErrors()
    {
        // Arrange
        var handler = BuildHandler();
        var command = new CreateClienteCommand("", "", "", "");

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(
            () => handler.Handle(command, CancellationToken.None));

        // FluentValidation should return at least 4 errors (one per field)
        Assert.True(ex.Errors.Count() >= 4,
            $"Expected at least 4 validation errors, but got {ex.Errors.Count()}");
    }

    // ─────────────────────────────────────────────────────────────────────
    // Valid create — entity properties
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_ValidInput_ReturnsDtoWithNonEmptyGuid()
    {
        // Arrange: A valid command
        var handler = BuildHandler();
        var command = new CreateClienteCommand("Empresa Test", "900123456-1", "3001234567", "Bogotá");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert: ID is a real GUID (not default/empty)
        Assert.NotEqual(Guid.Empty, result.Id);
    }

    [Fact]
    public async Task Handle_ValidInput_ReturnsDtoWithCreatedAtApproximatelyNow()
    {
        // Arrange
        var beforeCall = DateTimeOffset.UtcNow.AddSeconds(-1);
        var handler = BuildHandler();
        var command = new CreateClienteCommand("Empresa Test", "900123456-1", "3001234567", "Bogotá");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);
        var afterCall = DateTimeOffset.UtcNow.AddSeconds(1);

        // Assert: CreatedAt is within the expected window
        Assert.True(result.CreatedAt >= beforeCall, "CreatedAt should be after call started");
        Assert.True(result.CreatedAt <= afterCall, "CreatedAt should be before call ended");
    }

    [Fact]
    public async Task Handle_ValidInput_ReturnsDtoWithCreatedAtCloseToUpdatedAt()
    {
        // Arrange: A freshly created entity should have CreatedAt ≈ UpdatedAt
        // Note: ClienteEntity.Create calls DateTimeOffset.UtcNow twice — these may
        // differ by a few nanoseconds on slower systems. We allow 1 second tolerance.
        var handler = BuildHandler();
        var command = new CreateClienteCommand("Empresa Test", "900123456-1", "3001234567", "Bogotá");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert: On creation, both timestamps are within 1 second of each other
        var diff = Math.Abs((result.CreatedAt - result.UpdatedAt).TotalSeconds);
        Assert.True(diff <= 1.0,
            $"Expected CreatedAt and UpdatedAt within 1s of each other, but diff was {diff:F3}s");
    }

    // ─────────────────────────────────────────────────────────────────────
    // Validator: error messages are human-readable (not codes)
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_EmptyNombre_ValidationExceptionHasNonEmptyMessage()
    {
        // Arrange
        var handler = BuildHandler();
        var command = new CreateClienteCommand("", "900123456-1", "3001234567", "Bogotá");

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(
            () => handler.Handle(command, CancellationToken.None));

        var nombreError = ex.Errors.FirstOrDefault(e => e.PropertyName == "Nombre");
        Assert.NotNull(nombreError);
        Assert.True(nombreError.ErrorMessage.Length > 0,
            "Error message for Nombre should not be empty");
    }

    // ─────────────────────────────────────────────────────────────────────
    // Cancellation token propagation
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_ValidInput_ForwardsCancellationTokenToRepository()
    {
        // Arrange
        var repo = new FakeClienteRepository();
        var handler = BuildHandler(repo);
        var command = new CreateClienteCommand("Empresa Test", "900123456-1", "3001234567", "Bogotá");
        using var cts = new CancellationTokenSource();

        // Act
        await handler.Handle(command, cts.Token);

        // Assert: Repository received the same CancellationToken
        Assert.Equal(cts.Token, repo.LastCancellationToken);
    }

    // ─────────────────────────────────────────────────────────────────────
    // NIT exact-match semantics (ExistsByNitAsync is called with exact NIT)
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_DifferentNitValue_DoesNotThrowConflictException()
    {
        // Arrange: Pre-seed with one NIT; create with a different NIT
        var existing = ClienteEntity.Create("Empresa A", "900000001", "3000000000", "Cali");
        var repo = new FakeClienteRepository([existing]);
        var handler = BuildHandler(repo);
        var command = new CreateClienteCommand("Empresa B", "900000002", "3001234567", "Bogotá");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert: Different NIT should NOT trigger ConflictException
        Assert.Equal("900000002", result.Nit);
    }

    [Fact]
    public async Task Handle_SameNitValue_ThrowsConflictException()
    {
        // Arrange: Pre-seed with same NIT that will be used
        var sameNit = "900000001";
        var existing = ClienteEntity.Create("Empresa A", sameNit, "3000000000", "Cali");
        var repo = new FakeClienteRepository([existing]);
        var handler = BuildHandler(repo);
        var command = new CreateClienteCommand("Empresa B", sameNit, "3001234567", "Bogotá");

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ConflictException>(
            () => handler.Handle(command, CancellationToken.None));

        Assert.Equal("El NIT/RUC ya está registrado", ex.Message);
    }
}
