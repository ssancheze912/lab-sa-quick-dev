using System;
using Xunit;
using SiesaAgents.Domain.Clientes.Entities;

// STORY 2.1 — Client List & Search
// Domain Entity Edge Case Tests (Unit Level — Domain Layer)
// Tests for ClienteEntity.Create() factory and field invariants.
//
// Coverage gaps addressed:
//   - ClienteEntity.Create() returns non-null entity
//   - Id is a non-empty Guid (auto-generated UUID)
//   - CreatedAt and UpdatedAt are DateTimeOffset (NOT DateTime) and within expected range
//   - All string fields are correctly assigned by Create()
//   - Two Create() calls generate different Ids (UUID uniqueness)
//   - Id.ToString() produces a valid UUID string format

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Unit tests for ClienteEntity domain model.
/// Verifies Create() factory, field invariants, and DateTimeOffset usage.
/// Framework: xUnit (no mocks needed — pure domain logic)
/// </summary>
public class ClienteEntityTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Edge: Create() factory returns a non-null entity
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// GIVEN: Valid field values
    /// WHEN:  ClienteEntity.Create() is called
    /// THEN:  Returns a non-null ClienteEntity instance
    /// </summary>
    [Fact]
    public void GivenValidFields_WhenCreate_ThenReturnsNonNullEntity()
    {
        // WHEN: Create with valid input
        var entity = ClienteEntity.Create("Empresa Test", "900000001-1", "3001111111", "Bogotá");

        // THEN: Not null
        Assert.NotNull(entity);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: Id is a non-empty Guid (UUID auto-generated)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// GIVEN: ClienteEntity.Create() is called
    /// WHEN:  Entity is created
    /// THEN:  Id is a non-empty Guid (not Guid.Empty)
    /// </summary>
    [Fact]
    public void GivenCreate_WhenCalled_ThenIdIsNonEmptyGuid()
    {
        // WHEN
        var entity = ClienteEntity.Create("Empresa UUID", "900000002-2", "3002222222", "Medellín");

        // THEN: Id is not Guid.Empty
        Assert.NotEqual(Guid.Empty, entity.Id);
    }

    /// <summary>
    /// GIVEN: ClienteEntity.Create() is called
    /// WHEN:  Id is inspected
    /// THEN:  Id.ToString() produces a valid UUID format string
    /// </summary>
    [Fact]
    public void GivenCreate_WhenCalled_ThenIdIsValidUuidFormat()
    {
        // WHEN
        var entity = ClienteEntity.Create("Empresa Formato UUID", "900000003-3", "3003333333", "Cali");

        // THEN: Guid.Parse succeeds (valid UUID format)
        Assert.True(Guid.TryParse(entity.Id.ToString(), out _),
            $"Expected valid UUID, got: '{entity.Id}'");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: Two Create() calls produce different Ids (UUID uniqueness)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// GIVEN: Two separate calls to ClienteEntity.Create()
    /// WHEN:  Ids are compared
    /// THEN:  The two Ids are different (Guid.NewGuid() is unique per call)
    /// </summary>
    [Fact]
    public void GivenTwoCreateCalls_WhenIdsCompared_ThenIdsAreDifferent()
    {
        // WHEN: Two entities created
        var entity1 = ClienteEntity.Create("Empresa UUID Uno", "900000004-4", "3004444444", "Cúcuta");
        var entity2 = ClienteEntity.Create("Empresa UUID Dos", "900000005-5", "3005555555", "Cartagena");

        // THEN: Ids are distinct
        Assert.NotEqual(entity1.Id, entity2.Id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: String fields assigned correctly by Create()
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// GIVEN: ClienteEntity.Create() called with specific Nombre
    /// WHEN:  Nombre is read
    /// THEN:  Nombre matches input
    /// </summary>
    [Fact]
    public void GivenCreate_WhenNombreProvided_ThenNombreIsAssigned()
    {
        // WHEN
        var entity = ClienteEntity.Create("Empresa Nombre Asignado", "900000006-6", "3006666666", "Pereira");

        // THEN
        Assert.Equal("Empresa Nombre Asignado", entity.Nombre);
    }

    /// <summary>
    /// GIVEN: ClienteEntity.Create() called with a specific Nit
    /// WHEN:  Nit is read
    /// THEN:  Nit matches input (including dash separator)
    /// </summary>
    [Fact]
    public void GivenCreate_WhenNitProvided_ThenNitIsAssigned()
    {
        // WHEN
        var entity = ClienteEntity.Create("Empresa NIT Asignado", "900777007-7", "3007777777", "Manizales");

        // THEN: Nit is stored exactly as provided (with dash)
        Assert.Equal("900777007-7", entity.Nit);
    }

    /// <summary>
    /// GIVEN: ClienteEntity.Create() called with a specific Telefono
    /// WHEN:  Telefono is read
    /// THEN:  Telefono matches input
    /// </summary>
    [Fact]
    public void GivenCreate_WhenTelefonoProvided_ThenTelefonoIsAssigned()
    {
        // WHEN
        var entity = ClienteEntity.Create("Empresa Telefono Test", "900888008-8", "3008888888", "Bogotá");

        // THEN
        Assert.Equal("3008888888", entity.Telefono);
    }

    /// <summary>
    /// GIVEN: ClienteEntity.Create() called with a specific Ciudad
    /// WHEN:  Ciudad is read
    /// THEN:  Ciudad matches input
    /// </summary>
    [Fact]
    public void GivenCreate_WhenCiudadProvided_ThenCiudadIsAssigned()
    {
        // WHEN
        var entity = ClienteEntity.Create("Empresa Ciudad Test", "900999009-9", "3009999999", "Barranquilla");

        // THEN
        Assert.Equal("Barranquilla", entity.Ciudad);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: CreatedAt and UpdatedAt use DateTimeOffset (NOT DateTime)
    // This is a critical anti-pattern check per the story's Dev Notes
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// GIVEN: ClienteEntity.Create() is called
    /// WHEN:  CreatedAt is inspected
    /// THEN:  CreatedAt is of type DateTimeOffset (NOT DateTime)
    ///        and is within a reasonable range of UtcNow
    /// </summary>
    [Fact]
    public void GivenCreate_WhenCreatedAtInspected_ThenCreatedAtIsDateTimeOffsetNearNow()
    {
        // GIVEN: Capture timestamp boundaries
        var before = DateTimeOffset.UtcNow.AddSeconds(-2);

        // WHEN
        var entity = ClienteEntity.Create("Empresa CreatedAt Test", "900000010-0", "3000000000", "Bogotá");

        var after = DateTimeOffset.UtcNow.AddSeconds(2);

        // THEN: CreatedAt is a DateTimeOffset within the expected window
        Assert.IsType<DateTimeOffset>(entity.CreatedAt);
        Assert.InRange(entity.CreatedAt, before, after);
    }

    /// <summary>
    /// GIVEN: ClienteEntity.Create() is called
    /// WHEN:  UpdatedAt is inspected
    /// THEN:  UpdatedAt is of type DateTimeOffset (NOT DateTime)
    ///        and equals CreatedAt at creation time (both set in the same Create() call)
    /// </summary>
    [Fact]
    public void GivenCreate_WhenUpdatedAtInspected_ThenUpdatedAtEqualCreatedAt()
    {
        // WHEN
        var entity = ClienteEntity.Create("Empresa UpdatedAt Test", "900000011-1", "3000000001", "Bogotá");

        // THEN: UpdatedAt == CreatedAt at creation (both set to UtcNow in the same call)
        Assert.Equal(entity.CreatedAt, entity.UpdatedAt);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: CreatedAt is UTC (Kind.Utc for DateTimeOffset — offset == 0)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// GIVEN: ClienteEntity.Create() is called
    /// WHEN:  CreatedAt.Offset is inspected
    /// THEN:  Offset is TimeSpan.Zero (UTC — not a local timezone offset)
    /// </summary>
    [Fact]
    public void GivenCreate_WhenCreatedAtOffsetInspected_ThenOffsetIsUtcZero()
    {
        // WHEN
        var entity = ClienteEntity.Create("Empresa UTC Test", "900000012-2", "3000000002", "Bogotá");

        // THEN: CreatedAt offset is +00:00 (UTC)
        Assert.Equal(TimeSpan.Zero, entity.CreatedAt.Offset);
    }
}
