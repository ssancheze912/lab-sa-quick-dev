using Moq;
using Xunit;
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Validators;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Exceptions;
using SiesaAgents.Domain.Clientes.Interfaces;

// STORY 2.3 — Create Client
// ATDD Acceptance Tests — Unit Level (Application Layer)
//
// AC Coverage:
//   TC-E2-P0-01 — POST valid payload → 201 with UUID, nombre, nitRuc, telefono, ciudad, createdAt
//   TC-E2-P0-02 — Duplicate NIT/RUC → 409 with "El NIT/RUC ya está registrado" in detail, no stack trace
//   TC-E2-P0-03 — Missing required fields → 400 Problem Details with field-level errors
//   TC-E2-P3-04 — CreateClienteRequestValidator rejects empty Nombre field

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Unit tests for CreateClienteCommandHandler (Story 2.3 — Application layer).
/// Uses Moq to isolate handler from IClienteRepository.
/// Framework: xUnit + Moq
/// </summary>
public class CreateClienteCommandHandlerTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-P0-01: POST valid payload → returns ClienteDto with all fields
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-P0-01:
    /// GIVEN: A valid CreateClienteCommand with Nombre, NitRuc, Telefono, Ciudad
    /// WHEN:  CreateClienteCommandHandler.HandleAsync is called
    /// THEN:  Returns ClienteDto with non-empty Guid Id, matching fields, and non-default CreatedAt
    /// </summary>
    [Fact]
    public async Task GivenValidCommand_WhenHandleAsync_ThenReturnsClienteDtoWithAllFields()
    {
        // ARRANGE
        var entity = ClienteEntity.Create("Empresa Test S.A.S.", "900100001-1", "3001000001", "Bogotá");
        var repoMock = new Mock<IClienteRepository>();
        repoMock
            .Setup(r => r.CreateAsync(It.IsAny<ClienteEntity>()))
            .ReturnsAsync(entity);

        var handler = new CreateClienteCommandHandler(repoMock.Object);
        var command = new CreateClienteCommand("Empresa Test S.A.S.", "900100001-1", "3001000001", "Bogotá");

        // ACT
        var result = await handler.HandleAsync(command);

        // ASSERT
        Assert.NotNull(result);
        Assert.NotEqual(Guid.Empty, result.Id);
        Assert.Equal("Empresa Test S.A.S.", result.Nombre);
        Assert.Equal("900100001-1", result.NitRuc);
        Assert.Equal("3001000001", result.Telefono);
        Assert.Equal("Bogotá", result.Ciudad);
        Assert.NotEqual(default(DateTimeOffset), result.CreatedAt);
    }

    /// <summary>
    /// GIVEN: A valid command
    /// WHEN:  HandleAsync is called
    /// THEN:  IClienteRepository.CreateAsync is called exactly once
    /// </summary>
    [Fact]
    public async Task GivenValidCommand_WhenHandleAsync_ThenRepositoryCreateAsyncCalledOnce()
    {
        // ARRANGE
        var entity = ClienteEntity.Create("Test", "123", "456", "Cali");
        var repoMock = new Mock<IClienteRepository>();
        repoMock
            .Setup(r => r.CreateAsync(It.IsAny<ClienteEntity>()))
            .ReturnsAsync(entity);

        var handler = new CreateClienteCommandHandler(repoMock.Object);
        var command = new CreateClienteCommand("Test", "123", "456", "Cali");

        // ACT
        await handler.HandleAsync(command);

        // ASSERT
        repoMock.Verify(r => r.CreateAsync(It.IsAny<ClienteEntity>()), Times.Once);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-P0-02: Duplicate NIT/RUC → DuplicateNitException thrown
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-P0-02:
    /// GIVEN: IClienteRepository.CreateAsync throws DuplicateNitException
    /// WHEN:  CreateClienteCommandHandler.HandleAsync is called
    /// THEN:  DuplicateNitException propagates (middleware maps to HTTP 409 with "El NIT/RUC ya está registrado")
    /// </summary>
    [Fact]
    public async Task GivenDuplicateNit_WhenHandleAsync_ThenDuplicateNitExceptionThrown()
    {
        // ARRANGE
        var repoMock = new Mock<IClienteRepository>();
        repoMock
            .Setup(r => r.CreateAsync(It.IsAny<ClienteEntity>()))
            .ThrowsAsync(new DuplicateNitException("900111111-1"));

        var handler = new CreateClienteCommandHandler(repoMock.Object);
        var command = new CreateClienteCommand("Empresa Duplicada", "900111111-1", "3001111111", "Medellín");

        // ACT & ASSERT
        var ex = await Assert.ThrowsAsync<DuplicateNitException>(
            () => handler.HandleAsync(command));

        Assert.Contains("NIT/RUC", ex.Message);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-P3-04: CreateClienteRequestValidator rejects empty Nombre
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-P3-04:
    /// GIVEN: A CreateClienteRequest with empty Nombre
    /// WHEN:  CreateClienteRequestValidator.ValidateAsync is called
    /// THEN:  Validation fails with error on "Nombre" field
    /// </summary>
    [Fact]
    public async Task GivenEmptyNombre_WhenValidate_ThenValidationFails()
    {
        // ARRANGE
        var validator = new CreateClienteRequestValidator();
        var request = new CreateClienteRequest("", "900222222-2", "3002222222", "Cali");

        // ACT
        var result = await validator.ValidateAsync(request);

        // ASSERT
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Nombre");
    }

    /// <summary>
    /// TC-E2-P0-03 (validator portion):
    /// GIVEN: A CreateClienteRequest with all fields empty
    /// WHEN:  CreateClienteRequestValidator.ValidateAsync is called
    /// THEN:  Validation fails with 4 errors — one per required field
    /// </summary>
    [Fact]
    public async Task GivenAllFieldsEmpty_WhenValidate_ThenFourValidationErrors()
    {
        // ARRANGE
        var validator = new CreateClienteRequestValidator();
        var request = new CreateClienteRequest("", "", "", "");

        // ACT
        var result = await validator.ValidateAsync(request);

        // ASSERT
        Assert.False(result.IsValid);
        Assert.Equal(4, result.Errors.Count);
        Assert.Contains(result.Errors, e => e.PropertyName == "Nombre");
        Assert.Contains(result.Errors, e => e.PropertyName == "NitRuc");
        Assert.Contains(result.Errors, e => e.PropertyName == "Telefono");
        Assert.Contains(result.Errors, e => e.PropertyName == "Ciudad");
    }

    /// <summary>
    /// GIVEN: A CreateClienteRequest with all valid fields
    /// WHEN:  CreateClienteRequestValidator.ValidateAsync is called
    /// THEN:  Validation succeeds
    /// </summary>
    [Fact]
    public async Task GivenAllValidFields_WhenValidate_ThenValidationSucceeds()
    {
        // ARRANGE
        var validator = new CreateClienteRequestValidator();
        var request = new CreateClienteRequest("Empresa OK S.A.S.", "900999999-9", "3009999999", "Bogotá");

        // ACT
        var result = await validator.ValidateAsync(request);

        // ASSERT
        Assert.True(result.IsValid);
        Assert.Empty(result.Errors);
    }
}
