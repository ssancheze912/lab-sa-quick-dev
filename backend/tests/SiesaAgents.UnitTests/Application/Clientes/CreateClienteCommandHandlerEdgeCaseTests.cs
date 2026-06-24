using Microsoft.EntityFrameworkCore;
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Validators;
using SiesaAgents.Infrastructure.Data;
using SiesaAgents.Infrastructure.Repositories;
using Xunit;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Edge-case and boundary unit tests for CreateClienteCommandHandler and CreateClienteRequestValidator.
/// Expands coverage beyond CreateClienteCommandHandlerTests.cs.
/// Covers: each individual field empty/null, whitespace, boundary max lengths,
/// DTO field mapping completeness, validator field-level messages.
/// </summary>
public class CreateClienteCommandHandlerEdgeCaseTests
{
    private static AppDbContext CreateInMemoryContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        return new AppDbContext(options);
    }

    // ─── Handler: individual field guard checks ────────────────────────────────

    [Fact]
    public async Task HandleAsync_ThrowsArgumentException_WhenNitIsEmpty()
    {
        // Arrange
        await using var context = CreateInMemoryContext(nameof(HandleAsync_ThrowsArgumentException_WhenNitIsEmpty));
        var handler = new CreateClienteCommandHandler(new ClienteRepository(context));
        var command = new CreateClienteCommand("Empresa Válida", "", "3001234567", "Bogotá");

        // Act & Assert — ClienteEntity.Create guards against empty NIT
        await Assert.ThrowsAsync<ArgumentException>(() => handler.HandleAsync(command));
    }

    [Fact]
    public async Task HandleAsync_ThrowsArgumentException_WhenTelefonoIsEmpty()
    {
        // Arrange
        await using var context = CreateInMemoryContext(nameof(HandleAsync_ThrowsArgumentException_WhenTelefonoIsEmpty));
        var handler = new CreateClienteCommandHandler(new ClienteRepository(context));
        var command = new CreateClienteCommand("Empresa Válida", "900123456-1", "", "Bogotá");

        // Act & Assert — ClienteEntity.Create guards against empty Telefono
        await Assert.ThrowsAsync<ArgumentException>(() => handler.HandleAsync(command));
    }

    [Fact]
    public async Task HandleAsync_ThrowsArgumentException_WhenCiudadIsEmpty()
    {
        // Arrange
        await using var context = CreateInMemoryContext(nameof(HandleAsync_ThrowsArgumentException_WhenCiudadIsEmpty));
        var handler = new CreateClienteCommandHandler(new ClienteRepository(context));
        var command = new CreateClienteCommand("Empresa Válida", "900123456-1", "3001234567", "");

        // Act & Assert — ClienteEntity.Create guards against empty Ciudad
        await Assert.ThrowsAsync<ArgumentException>(() => handler.HandleAsync(command));
    }

    [Fact]
    public async Task HandleAsync_ThrowsArgumentException_WhenNombreIsWhitespaceOnly()
    {
        // Arrange
        await using var context = CreateInMemoryContext(nameof(HandleAsync_ThrowsArgumentException_WhenNombreIsWhitespaceOnly));
        var handler = new CreateClienteCommandHandler(new ClienteRepository(context));
        var command = new CreateClienteCommand("   ", "900123456-1", "3001234567", "Bogotá");

        // Act & Assert — ArgumentException.ThrowIfNullOrWhiteSpace rejects whitespace
        await Assert.ThrowsAsync<ArgumentException>(() => handler.HandleAsync(command));
    }

    [Fact]
    public async Task HandleAsync_ThrowsArgumentException_WhenNitIsWhitespaceOnly()
    {
        // Arrange
        await using var context = CreateInMemoryContext(nameof(HandleAsync_ThrowsArgumentException_WhenNitIsWhitespaceOnly));
        var handler = new CreateClienteCommandHandler(new ClienteRepository(context));
        var command = new CreateClienteCommand("Empresa Válida", "   ", "3001234567", "Bogotá");

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() => handler.HandleAsync(command));
    }

    // ─── Handler: DTO field mapping completeness ───────────────────────────────

    [Fact]
    public async Task HandleAsync_ReturnsDto_WithIdThatIsANonEmptyGuid()
    {
        // Arrange
        await using var context = CreateInMemoryContext(nameof(HandleAsync_ReturnsDto_WithIdThatIsANonEmptyGuid));
        var handler = new CreateClienteCommandHandler(new ClienteRepository(context));
        var command = new CreateClienteCommand("Empresa Guid Test", "900001001-5", "3001234567", "Bogotá");

        // Act
        var result = await handler.HandleAsync(command);

        // Assert
        Assert.NotEqual(Guid.Empty, result.Id);
    }

    [Fact]
    public async Task HandleAsync_ReturnsDto_WithCreatedAtAndUpdatedAtAsRecentTimestamps()
    {
        // Arrange
        await using var context = CreateInMemoryContext(nameof(HandleAsync_ReturnsDto_WithCreatedAtAndUpdatedAtAsRecentTimestamps));
        var handler = new CreateClienteCommandHandler(new ClienteRepository(context));
        var command = new CreateClienteCommand("Empresa Timestamp", "900001002-6", "3001234567", "Bogotá");
        var beforeCreate = DateTimeOffset.UtcNow.AddSeconds(-1);

        // Act
        var result = await handler.HandleAsync(command);

        // Assert — timestamps should be after the test started
        Assert.True(result.CreatedAt >= beforeCreate, "CreatedAt should be recent");
        Assert.True(result.UpdatedAt >= beforeCreate, "UpdatedAt should be recent");
    }

    [Fact]
    public async Task HandleAsync_ReturnsDto_ThatPreservesExactInputValues()
    {
        // Arrange
        await using var context = CreateInMemoryContext(nameof(HandleAsync_ReturnsDto_ThatPreservesExactInputValues));
        var handler = new CreateClienteCommandHandler(new ClienteRepository(context));
        const string nombre = "Empresa Preserva Valores SAS";
        const string nit = "123456789-0";
        const string telefono = "310-111-2222";
        const string ciudad = "Bucaramanga";
        var command = new CreateClienteCommand(nombre, nit, telefono, ciudad);

        // Act
        var result = await handler.HandleAsync(command);

        // Assert — values are not transformed
        Assert.Equal(nombre, result.Nombre);
        Assert.Equal(nit, result.Nit);
        Assert.Equal(telefono, result.Telefono);
        Assert.Equal(ciudad, result.Ciudad);
    }

    [Fact]
    public async Task HandleAsync_CanCreateMultipleClientsWithDifferentNits()
    {
        // Arrange
        await using var context = CreateInMemoryContext(nameof(HandleAsync_CanCreateMultipleClientsWithDifferentNits));
        var handler = new CreateClienteCommandHandler(new ClienteRepository(context));

        // Act — create two clients with different NITs
        var result1 = await handler.HandleAsync(new CreateClienteCommand("Empresa Uno", "100-NIT-001", "3001111111", "Bogotá"));
        var result2 = await handler.HandleAsync(new CreateClienteCommand("Empresa Dos", "100-NIT-002", "3002222222", "Medellín"));

        // Assert — both created with distinct IDs
        Assert.NotEqual(result1.Id, result2.Id);
        Assert.Equal("Empresa Uno", result1.Nombre);
        Assert.Equal("Empresa Dos", result2.Nombre);
    }

    [Fact]
    public async Task HandleAsync_UsesProvidedCancellationToken_WithoutThrowingOnDefault()
    {
        // Arrange
        await using var context = CreateInMemoryContext(nameof(HandleAsync_UsesProvidedCancellationToken_WithoutThrowingOnDefault));
        var handler = new CreateClienteCommandHandler(new ClienteRepository(context));
        var command = new CreateClienteCommand("Empresa CT", "900001003-7", "3001234567", "Cali");

        // Act — use an explicit CancellationToken (not cancelled) — should not throw
        var result = await handler.HandleAsync(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
    }

    // ─── Validator: boundary conditions ───────────────────────────────────────

    [Fact]
    public void Validator_Passes_WhenAllFieldsAreAtExactMaxLength()
    {
        // Arrange
        var validator = new CreateClienteRequestValidator();
        var request = new CreateClienteRequest(
            new string('A', 200),   // exactly 200
            new string('B', 50),    // exactly 50
            new string('C', 30),    // exactly 30
            new string('D', 100));  // exactly 100

        // Act
        var result = validator.Validate(request);

        // Assert — at-boundary values must pass
        Assert.True(result.IsValid, string.Join(", ", result.Errors.Select(e => e.ErrorMessage)));
    }

    [Fact]
    public void Validator_Fails_WhenNombreExceedsMaxLength()
    {
        // Arrange
        var validator = new CreateClienteRequestValidator();
        var request = new CreateClienteRequest(new string('A', 201), "900-valid", "3001234567", "Bogotá");

        // Act
        var result = validator.Validate(request);

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Nombre");
    }

    [Fact]
    public void Validator_Fails_WhenNitExceedsMaxLength()
    {
        // Arrange
        var validator = new CreateClienteRequestValidator();
        var request = new CreateClienteRequest("Empresa Válida", new string('N', 51), "3001234567", "Bogotá");

        // Act
        var result = validator.Validate(request);

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Nit");
    }

    [Fact]
    public void Validator_Fails_WhenTelefonoExceedsMaxLength()
    {
        // Arrange
        var validator = new CreateClienteRequestValidator();
        var request = new CreateClienteRequest("Empresa Válida", "900-valid", new string('1', 31), "Bogotá");

        // Act
        var result = validator.Validate(request);

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Telefono");
    }

    [Fact]
    public void Validator_Fails_WhenCiudadExceedsMaxLength()
    {
        // Arrange
        var validator = new CreateClienteRequestValidator();
        var request = new CreateClienteRequest("Empresa Válida", "900-valid", "3001234567", new string('C', 101));

        // Act
        var result = validator.Validate(request);

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Ciudad");
    }

    [Fact]
    public void Validator_Fails_WhenOnlyNombreIsMissing()
    {
        // Arrange
        var validator = new CreateClienteRequestValidator();
        var request = new CreateClienteRequest("", "900-valid", "3001234567", "Bogotá");

        // Act
        var result = validator.Validate(request);

        // Assert — only Nombre fails, other fields pass
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Nombre");
        Assert.DoesNotContain(result.Errors, e => e.PropertyName == "Nit");
        Assert.DoesNotContain(result.Errors, e => e.PropertyName == "Telefono");
        Assert.DoesNotContain(result.Errors, e => e.PropertyName == "Ciudad");
    }

    [Fact]
    public void Validator_Fails_WhenOnlyNitIsMissing()
    {
        // Arrange
        var validator = new CreateClienteRequestValidator();
        var request = new CreateClienteRequest("Empresa Válida", "", "3001234567", "Bogotá");

        // Act
        var result = validator.Validate(request);

        // Assert — only Nit fails
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Nit");
        Assert.DoesNotContain(result.Errors, e => e.PropertyName == "Nombre");
        Assert.DoesNotContain(result.Errors, e => e.PropertyName == "Telefono");
        Assert.DoesNotContain(result.Errors, e => e.PropertyName == "Ciudad");
    }

    [Fact]
    public void Validator_Fails_WhenOnlyTelefonoIsMissing()
    {
        // Arrange
        var validator = new CreateClienteRequestValidator();
        var request = new CreateClienteRequest("Empresa Válida", "900-valid", "", "Bogotá");

        // Act
        var result = validator.Validate(request);

        // Assert — only Telefono fails
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Telefono");
        Assert.DoesNotContain(result.Errors, e => e.PropertyName == "Nombre");
        Assert.DoesNotContain(result.Errors, e => e.PropertyName == "Nit");
        Assert.DoesNotContain(result.Errors, e => e.PropertyName == "Ciudad");
    }

    [Fact]
    public void Validator_Fails_WhenOnlyCiudadIsMissing()
    {
        // Arrange
        var validator = new CreateClienteRequestValidator();
        var request = new CreateClienteRequest("Empresa Válida", "900-valid", "3001234567", "");

        // Act
        var result = validator.Validate(request);

        // Assert — only Ciudad fails
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Ciudad");
        Assert.DoesNotContain(result.Errors, e => e.PropertyName == "Nombre");
        Assert.DoesNotContain(result.Errors, e => e.PropertyName == "Nit");
        Assert.DoesNotContain(result.Errors, e => e.PropertyName == "Telefono");
    }

    [Fact]
    public void Validator_Passes_WhenAllFieldsHaveMinimumValidValues()
    {
        // Arrange
        var validator = new CreateClienteRequestValidator();
        var request = new CreateClienteRequest("A", "B", "C", "D"); // single characters

        // Act
        var result = validator.Validate(request);

        // Assert — single-character values satisfy NotEmpty and MaximumLength
        Assert.True(result.IsValid, string.Join(", ", result.Errors.Select(e => e.ErrorMessage)));
    }

    // ─── CreateClienteCommand record shape ─────────────────────────────────────

    [Fact]
    public void CreateClienteCommand_ExposesAllFourProperties()
    {
        // Arrange & Act
        var command = new CreateClienteCommand("Nombre Test", "NIT-TEST", "300-TEST", "Ciudad Test");

        // Assert — record positional properties
        Assert.Equal("Nombre Test", command.Nombre);
        Assert.Equal("NIT-TEST", command.Nit);
        Assert.Equal("300-TEST", command.Telefono);
        Assert.Equal("Ciudad Test", command.Ciudad);
    }

    [Fact]
    public void CreateClienteCommand_SupportsValueEquality()
    {
        // Arrange
        var a = new CreateClienteCommand("Nombre", "NIT", "Tel", "Ciudad");
        var b = new CreateClienteCommand("Nombre", "NIT", "Tel", "Ciudad");

        // Assert — records support structural equality
        Assert.Equal(a, b);
    }
}
