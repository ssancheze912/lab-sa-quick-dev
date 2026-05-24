/**
 * Story 2.3: Create Client — Backend Unit Tests (ATDD RED Phase)
 * Epic 2: Client Management
 *
 * Acceptance Criteria covered:
 *   AC7 — Handler creates entity, persists it, returns ClienteDto with UUID id
 *   AC8 — Handler does NOT persist when validator rejects (tested at endpoint level)
 *   AC9 — Handler throws DuplicateNitException when ExistsByNitAsync returns true
 *
 * Test status: RED — tests will fail to compile until implementation is complete:
 *   - SiesaAgents.Application.Clientes.Commands.CreateClienteCommand       (does NOT exist yet)
 *   - SiesaAgents.Application.Clientes.Commands.CreateClienteCommandHandler (does NOT exist yet)
 *   - SiesaAgents.Domain.Clientes.Exceptions.DuplicateNitException           (does NOT exist yet)
 *   - IClienteRepository.ExistsByNitAsync()                                  (does NOT exist yet)
 *   - IClienteRepository.AddAsync()                                           (does NOT exist yet)
 *
 * Framework: xUnit + NSubstitute
 * Structure: Given-When-Then (Arrange/Act/Assert)
 */

using System;
using System.Threading;
using System.Threading.Tasks;
using NSubstitute;
using Xunit;

// Existing namespaces
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

// Namespaces that do NOT exist yet — will cause compile failure (RED phase)
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Domain.Clientes.Exceptions;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Unit tests for CreateClienteCommandHandler.
/// AC7: Handler creates entity, persists it, returns ClienteDto with UUID id.
/// AC9: Handler throws DuplicateNitException when NIT already exists.
/// </summary>
public class CreateClienteCommandHandlerTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // AC7 — Handler creates entity and returns ClienteDto on happy path
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_WhenNitIsUnique_ReturnsClienteDto()
    {
        // GIVEN: NIT does not exist; repository accepts the new entity
        var mockRepository = Substitute.For<IClienteRepository>();
        mockRepository.ExistsByNitAsync("900123456-7", Arg.Any<CancellationToken>())
            .Returns(false);
        mockRepository.AddAsync(Arg.Any<ClienteEntity>(), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);
        mockRepository.SaveChangesAsync(Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        var handler = new CreateClienteCommandHandler(mockRepository);
        var command = new CreateClienteCommand("Acme Colombia SAS", "900123456-7", "+57 601 234 5678", "Bogotá");

        // WHEN: Command is handled
        var result = await handler.Handle(command, CancellationToken.None);

        // THEN: A non-null ClienteDto is returned
        Assert.NotNull(result);
        Assert.IsType<ClienteDto>(result);
    }

    [Fact]
    public async Task Handle_WhenNitIsUnique_ReturnsDtoWithNombreMatchingCommand()
    {
        // GIVEN: Unique NIT scenario
        var mockRepository = Substitute.For<IClienteRepository>();
        mockRepository.ExistsByNitAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(false);
        mockRepository.AddAsync(Arg.Any<ClienteEntity>(), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);
        mockRepository.SaveChangesAsync(Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        var handler = new CreateClienteCommandHandler(mockRepository);
        var command = new CreateClienteCommand("Acme Colombia SAS", "900123456-7", "+57 601 234 5678", "Bogotá");

        // WHEN: Command is handled
        var result = await handler.Handle(command, CancellationToken.None);

        // THEN: DTO Nombre matches the command input
        Assert.Equal("Acme Colombia SAS", result!.Nombre);
    }

    [Fact]
    public async Task Handle_WhenNitIsUnique_ReturnsDtoWithNitMatchingCommand()
    {
        // GIVEN: Unique NIT scenario
        var mockRepository = Substitute.For<IClienteRepository>();
        mockRepository.ExistsByNitAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(false);
        mockRepository.AddAsync(Arg.Any<ClienteEntity>(), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);
        mockRepository.SaveChangesAsync(Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        var handler = new CreateClienteCommandHandler(mockRepository);
        var command = new CreateClienteCommand("Acme Colombia SAS", "900123456-7", "+57 601 234 5678", "Bogotá");

        // WHEN: Command is handled
        var result = await handler.Handle(command, CancellationToken.None);

        // THEN: DTO Nit matches
        Assert.Equal("900123456-7", result!.Nit);
    }

    [Fact]
    public async Task Handle_WhenNitIsUnique_ReturnsDtoWithNonEmptyUuidId()
    {
        // GIVEN: Unique NIT — R-008 mitigation (UUID, not integer PK)
        var mockRepository = Substitute.For<IClienteRepository>();
        mockRepository.ExistsByNitAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(false);
        mockRepository.AddAsync(Arg.Any<ClienteEntity>(), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);
        mockRepository.SaveChangesAsync(Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        var handler = new CreateClienteCommandHandler(mockRepository);
        var command = new CreateClienteCommand("Acme Colombia SAS", "900123456-7", "+57 601 234 5678", "Bogotá");

        // WHEN: Command is handled
        var result = await handler.Handle(command, CancellationToken.None);

        // THEN: DTO Id is a non-empty GUID (not an integer sequence)
        Assert.NotEqual(Guid.Empty, result!.Id);
    }

    [Fact]
    public async Task Handle_WhenNitIsUnique_ReturnsDtoWithCreatedAtAsDateTimeOffset()
    {
        // GIVEN: Unique NIT — company standard: DateTimeOffset, never DateTime
        var mockRepository = Substitute.For<IClienteRepository>();
        mockRepository.ExistsByNitAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(false);
        mockRepository.AddAsync(Arg.Any<ClienteEntity>(), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);
        mockRepository.SaveChangesAsync(Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        var handler = new CreateClienteCommandHandler(mockRepository);
        var command = new CreateClienteCommand("Acme Colombia SAS", "900123456-7", "+57 601 234 5678", "Bogotá");

        // WHEN: Command is handled
        var result = await handler.Handle(command, CancellationToken.None);

        // THEN: CreatedAt is a non-default DateTimeOffset
        Assert.IsType<DateTimeOffset>(result!.CreatedAt);
        Assert.NotEqual(default(DateTimeOffset), result.CreatedAt);
    }

    [Fact]
    public async Task Handle_WhenNitIsUnique_CallsAddAsyncOnRepository()
    {
        // GIVEN: Unique NIT
        var mockRepository = Substitute.For<IClienteRepository>();
        mockRepository.ExistsByNitAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(false);
        mockRepository.AddAsync(Arg.Any<ClienteEntity>(), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);
        mockRepository.SaveChangesAsync(Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        var handler = new CreateClienteCommandHandler(mockRepository);
        var command = new CreateClienteCommand("Acme Colombia SAS", "900123456-7", "+57 601 234 5678", "Bogotá");

        // WHEN: Command is handled
        await handler.Handle(command, CancellationToken.None);

        // THEN: AddAsync was called exactly once
        await mockRepository.Received(1).AddAsync(Arg.Any<ClienteEntity>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WhenNitIsUnique_CallsExistsByNitAsyncWithCorrectNit()
    {
        // GIVEN: Unique NIT
        var mockRepository = Substitute.For<IClienteRepository>();
        mockRepository.ExistsByNitAsync("900123456-7", Arg.Any<CancellationToken>())
            .Returns(false);
        mockRepository.AddAsync(Arg.Any<ClienteEntity>(), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);
        mockRepository.SaveChangesAsync(Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        var handler = new CreateClienteCommandHandler(mockRepository);
        var command = new CreateClienteCommand("Acme Colombia SAS", "900123456-7", "+57 601 234 5678", "Bogotá");

        // WHEN: Command is handled
        await handler.Handle(command, CancellationToken.None);

        // THEN: ExistsByNitAsync was called with the correct NIT
        await mockRepository.Received(1).ExistsByNitAsync("900123456-7", Arg.Any<CancellationToken>());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC9 — Handler throws DuplicateNitException when NIT already exists
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_WhenNitAlreadyExists_ThrowsDuplicateNitException()
    {
        // GIVEN: ExistsByNitAsync returns true (duplicate NIT)
        var mockRepository = Substitute.For<IClienteRepository>();
        mockRepository.ExistsByNitAsync("900123456-7", Arg.Any<CancellationToken>())
            .Returns(true);

        var handler = new CreateClienteCommandHandler(mockRepository);
        var command = new CreateClienteCommand("Empresa Diferente SA", "900123456-7", "+57 601 999 0000", "Medellín");

        // WHEN/THEN: Handling the command throws DuplicateNitException
        await Assert.ThrowsAsync<DuplicateNitException>(
            async () => await handler.Handle(command, CancellationToken.None)
        );
    }

    [Fact]
    public async Task Handle_WhenNitAlreadyExists_DoesNotCallAddAsync()
    {
        // GIVEN: Duplicate NIT detected before AddAsync is reached
        var mockRepository = Substitute.For<IClienteRepository>();
        mockRepository.ExistsByNitAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(true);

        var handler = new CreateClienteCommandHandler(mockRepository);
        var command = new CreateClienteCommand("Empresa Diferente SA", "900123456-7", "+57 601 999 0000", "Medellín");

        // WHEN: Command is handled (throws)
        await Assert.ThrowsAsync<DuplicateNitException>(
            async () => await handler.Handle(command, CancellationToken.None)
        );

        // THEN: AddAsync was never called (no partial persistence)
        await mockRepository.DidNotReceive().AddAsync(Arg.Any<ClienteEntity>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WhenNitAlreadyExists_DuplicateNitExceptionContainsNit()
    {
        // GIVEN: Duplicate NIT scenario
        var mockRepository = Substitute.For<IClienteRepository>();
        mockRepository.ExistsByNitAsync("900123456-7", Arg.Any<CancellationToken>())
            .Returns(true);

        var handler = new CreateClienteCommandHandler(mockRepository);
        var command = new CreateClienteCommand("Empresa Diferente SA", "900123456-7", "+57 601 999 0000", "Medellín");

        // WHEN: DuplicateNitException is thrown
        var ex = await Assert.ThrowsAsync<DuplicateNitException>(
            async () => await handler.Handle(command, CancellationToken.None)
        );

        // THEN: Exception carries the duplicate NIT
        Assert.Equal("900123456-7", ex.Nit);
    }
}
