using System;
using System.Threading.Tasks;
using Moq;
using Xunit;
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Validators;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

// STORY 2.3 — Create Client
// ATDD Acceptance Tests — RED Phase (Unit Level — Application Layer)
// These tests FAIL until the implementation is complete.
//
// AC Coverage:
//   AC2 — CreateClienteCommandHandler.HandleAsync(command) calls repository.CreateAsync
//          and returns a ClienteDto with all fields (TC-E2-P0-01 unit portion)
//   AC3 — CreateClienteRequestValidator rejects empty Nombre (TC-E2-P3-04)
//   AC4 — Command handler propagates uniqueness exception from repository (TC-E2-P0-02 unit portion)

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Unit tests for CreateClienteCommandHandler (Story 2.3 — Application layer).
/// Uses Moq to isolate the handler from IClienteRepository.
/// Framework: xUnit + Moq
/// </summary>
public class CreateClienteCommandHandlerTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-P0-01 (unit portion): Handler calls CreateAsync and returns ClienteDto
    // AC2: Valid command → repository.CreateAsync called, ClienteDto returned
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// GIVEN: IClienteRepository.CreateAsync returns the created ClienteEntity
    /// WHEN:  CreateClienteCommandHandler.HandleAsync(command) is called with valid data
    /// THEN:  Returns a ClienteDto with id (non-empty GUID), nombre, nitRuc, telefono, ciudad, createdAt
    /// RED:   Fails because CreateClienteCommandHandler class does not exist yet
    /// </summary>
    [Fact]
    public async Task GivenValidCommand_WhenHandleAsync_ThenReturnsClienteDtoWithAllFields()
    {
        // GIVEN: IClienteRepository returns a created entity
        var repoMock = new Mock<IClienteRepository>();
        var entity = ClienteEntity.Create("Empresa XYZ S.A.S.", "900123456-1", "3001234567", "Bogotá");

        repoMock
            .Setup(r => r.CreateAsync(It.IsAny<ClienteEntity>()))
            .ReturnsAsync(entity);

        var handler = new CreateClienteCommandHandler(repoMock.Object);
        var command = new CreateClienteCommand(
            Nombre: "Empresa XYZ S.A.S.",
            NitRuc: "900123456-1",
            Telefono: "3001234567",
            Ciudad: "Bogotá"
        );

        // WHEN: HandleAsync is called with valid command
        var result = await handler.HandleAsync(command);

        // THEN: Result is a ClienteDto with a non-empty UUID
        Assert.NotNull(result);
        Assert.NotEqual(Guid.Empty, result.Id);
        Assert.Equal("Empresa XYZ S.A.S.", result.Nombre);
        Assert.Equal("900123456-1", result.NitRuc);
        Assert.Equal("3001234567", result.Telefono);
        Assert.Equal("Bogotá", result.Ciudad);
        Assert.NotEqual(default, result.CreatedAt);
    }

    /// <summary>
    /// GIVEN: IClienteRepository.CreateAsync is set up to return a created entity
    /// WHEN:  CreateClienteCommandHandler.HandleAsync(command) is called
    /// THEN:  repository.CreateAsync is invoked exactly once (AC2: client is persisted)
    /// RED:   Fails because CreateClienteCommandHandler class does not exist yet
    /// </summary>
    [Fact]
    public async Task GivenValidCommand_WhenHandleAsync_ThenRepositoryCreateAsyncCalledOnce()
    {
        // GIVEN: Mocked repository
        var repoMock = new Mock<IClienteRepository>();
        var entity = ClienteEntity.Create("Empresa Persist S.A.", "900222222-2", "3002222222", "Medellín");

        repoMock
            .Setup(r => r.CreateAsync(It.IsAny<ClienteEntity>()))
            .ReturnsAsync(entity);

        var handler = new CreateClienteCommandHandler(repoMock.Object);
        var command = new CreateClienteCommand(
            Nombre: "Empresa Persist S.A.",
            NitRuc: "900222222-2",
            Telefono: "3002222222",
            Ciudad: "Medellín"
        );

        // WHEN: HandleAsync is called
        await handler.HandleAsync(command);

        // THEN: repository.CreateAsync was called exactly once
        repoMock.Verify(r => r.CreateAsync(It.IsAny<ClienteEntity>()), Times.Once);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-P0-02 (unit portion): Duplicate NIT/RUC — handler propagates exception
    // AC4: Repository throws conflict exception → handler does not swallow it
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// GIVEN: IClienteRepository.CreateAsync throws a conflict exception (duplicate NIT/RUC)
    /// WHEN:  CreateClienteCommandHandler.HandleAsync(command) is called
    /// THEN:  The exception propagates out of the handler (not swallowed silently)
    /// RED:   Fails because CreateClienteCommandHandler class does not exist yet
    /// </summary>
    [Fact]
    public async Task GivenRepositoryThrowsConflictException_WhenHandleAsync_ThenExceptionPropagates()
    {
        // GIVEN: IClienteRepository.CreateAsync throws a conflict exception on duplicate NIT/RUC
        var repoMock = new Mock<IClienteRepository>();
        repoMock
            .Setup(r => r.CreateAsync(It.IsAny<ClienteEntity>()))
            .ThrowsAsync(new InvalidOperationException("El NIT/RUC ya está registrado"));

        var handler = new CreateClienteCommandHandler(repoMock.Object);
        var command = new CreateClienteCommand(
            Nombre: "Empresa Duplicada S.A.",
            NitRuc: "900999001-1",
            Telefono: "3003333333",
            Ciudad: "Cali"
        );

        // WHEN: HandleAsync is called with a NIT/RUC that triggers a conflict
        // THEN: The exception propagates (handler does not silently swallow it)
        await Assert.ThrowsAnyAsync<Exception>(() => handler.HandleAsync(command));
    }
}

/// <summary>
/// Unit tests for CreateClienteRequestValidator (Story 2.3 — Application layer).
/// TC-E2-P3-04: FluentValidation rejects missing required fields.
/// Framework: xUnit + FluentValidation
/// </summary>
public class CreateClienteRequestValidatorTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-P3-04: FluentValidation rejects empty Nombre
    // AC3: All 4 required fields validated; Spanish error messages
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// GIVEN: CreateClienteRequest with an empty Nombre field
    /// WHEN:  CreateClienteRequestValidator.ValidateAsync(request) is called
    /// THEN:  Validation fails with an error on the Nombre field
    /// RED:   Fails because CreateClienteRequestValidator class does not exist yet
    /// </summary>
    [Fact]
    public async Task GivenEmptyNombre_WhenValidate_ThenReturnsNombreFieldError()
    {
        // GIVEN: Request with empty Nombre
        var validator = new CreateClienteRequestValidator();
        var request = new CreateClienteRequest
        {
            Nombre = "",
            NitRuc = "900111111-1",
            Telefono = "3001234567",
            Ciudad = "Bogotá"
        };

        // WHEN: Validation is executed
        var result = await validator.ValidateAsync(request);

        // THEN: Validation fails with an error on 'Nombre'
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e =>
            e.PropertyName.Equals("Nombre", StringComparison.OrdinalIgnoreCase));
    }

    /// <summary>
    /// GIVEN: CreateClienteRequest with an empty NitRuc field
    /// WHEN:  CreateClienteRequestValidator.ValidateAsync(request) is called
    /// THEN:  Validation fails with an error on the NitRuc field
    /// RED:   Fails because CreateClienteRequestValidator class does not exist yet
    /// </summary>
    [Fact]
    public async Task GivenEmptyNitRuc_WhenValidate_ThenReturnsNitRucFieldError()
    {
        // GIVEN: Request with empty NitRuc
        var validator = new CreateClienteRequestValidator();
        var request = new CreateClienteRequest
        {
            Nombre = "Empresa Valida S.A.",
            NitRuc = "",
            Telefono = "3001234567",
            Ciudad = "Bogotá"
        };

        // WHEN: Validation is executed
        var result = await validator.ValidateAsync(request);

        // THEN: Validation fails with an error on 'NitRuc'
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e =>
            e.PropertyName.Equals("NitRuc", StringComparison.OrdinalIgnoreCase));
    }

    /// <summary>
    /// GIVEN: CreateClienteRequest with an empty Telefono field
    /// WHEN:  CreateClienteRequestValidator.ValidateAsync(request) is called
    /// THEN:  Validation fails with an error on the Telefono field
    /// RED:   Fails because CreateClienteRequestValidator class does not exist yet
    /// </summary>
    [Fact]
    public async Task GivenEmptyTelefono_WhenValidate_ThenReturnsTelefonoFieldError()
    {
        // GIVEN: Request with empty Telefono
        var validator = new CreateClienteRequestValidator();
        var request = new CreateClienteRequest
        {
            Nombre = "Empresa Valida S.A.",
            NitRuc = "900111111-1",
            Telefono = "",
            Ciudad = "Bogotá"
        };

        // WHEN: Validation is executed
        var result = await validator.ValidateAsync(request);

        // THEN: Validation fails with an error on 'Telefono'
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e =>
            e.PropertyName.Equals("Telefono", StringComparison.OrdinalIgnoreCase));
    }

    /// <summary>
    /// GIVEN: CreateClienteRequest with an empty Ciudad field
    /// WHEN:  CreateClienteRequestValidator.ValidateAsync(request) is called
    /// THEN:  Validation fails with an error on the Ciudad field
    /// RED:   Fails because CreateClienteRequestValidator class does not exist yet
    /// </summary>
    [Fact]
    public async Task GivenEmptyCiudad_WhenValidate_ThenReturnsCiudadFieldError()
    {
        // GIVEN: Request with empty Ciudad
        var validator = new CreateClienteRequestValidator();
        var request = new CreateClienteRequest
        {
            Nombre = "Empresa Valida S.A.",
            NitRuc = "900111111-1",
            Telefono = "3001234567",
            Ciudad = ""
        };

        // WHEN: Validation is executed
        var result = await validator.ValidateAsync(request);

        // THEN: Validation fails with an error on 'Ciudad'
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e =>
            e.PropertyName.Equals("Ciudad", StringComparison.OrdinalIgnoreCase));
    }

    /// <summary>
    /// GIVEN: CreateClienteRequest with all fields filled correctly
    /// WHEN:  CreateClienteRequestValidator.ValidateAsync(request) is called
    /// THEN:  Validation passes with no errors
    /// RED:   Fails because CreateClienteRequestValidator class does not exist yet
    /// </summary>
    [Fact]
    public async Task GivenAllFieldsValid_WhenValidate_ThenValidationPasses()
    {
        // GIVEN: Request with all 4 required fields populated
        var validator = new CreateClienteRequestValidator();
        var request = new CreateClienteRequest
        {
            Nombre = "Empresa Completa S.A.S.",
            NitRuc = "900222222-2",
            Telefono = "3002345678",
            Ciudad = "Medellín"
        };

        // WHEN: Validation is executed
        var result = await validator.ValidateAsync(request);

        // THEN: Validation passes — no errors
        Assert.True(result.IsValid);
        Assert.Empty(result.Errors);
    }
}
