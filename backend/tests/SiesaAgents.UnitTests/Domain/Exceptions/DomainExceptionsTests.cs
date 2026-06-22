using SiesaAgents.Domain.Exceptions;

namespace SiesaAgents.UnitTests.Domain.Exceptions;

/// <summary>
/// Story 1.3: Backend Database Foundation
/// ATDD Unit Tests — RED Phase (Domain Layer)
///
/// Acceptance Criteria covered:
///   AC3 — Domain exception classes (NotFoundException, ConflictException) must exist in
///          SiesaAgents.Domain/Exceptions/ with correct base class and message propagation.
///          These are prerequisites for the ExceptionHandlingMiddleware to map them correctly.
/// </summary>
public class DomainExceptionsTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // NotFoundException
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void NotFoundException_InheritsFromException()
    {
        // GIVEN: NotFoundException is a domain exception class
        // WHEN: We inspect its type hierarchy
        // THEN: NotFoundException inherits from System.Exception (required for catch blocks to work)
        Assert.True(typeof(NotFoundException).IsSubclassOf(typeof(Exception)));
    }

    [Fact]
    public void NotFoundException_WhenCreatedWithMessage_ExposesMessageProperty()
    {
        // GIVEN: A not-found scenario with a descriptive message
        var message = "Cliente con id '550e8400-e29b-41d4-a716-446655440000' no encontrado";

        // WHEN: NotFoundException is instantiated
        var exception = new NotFoundException(message);

        // THEN: The Message property contains the provided message (standard Exception contract)
        Assert.Equal(message, exception.Message);
    }

    [Fact]
    public void NotFoundException_IsInDomainExceptionsNamespace()
    {
        // GIVEN: Clean Architecture mandates domain exceptions live in SiesaAgents.Domain.Exceptions
        // WHEN: We check the namespace of NotFoundException
        // THEN: The namespace matches the required location
        Assert.Equal("SiesaAgents.Domain.Exceptions", typeof(NotFoundException).Namespace);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ConflictException
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void ConflictException_InheritsFromException()
    {
        // GIVEN: ConflictException is a domain exception class
        // WHEN: We inspect its type hierarchy
        // THEN: ConflictException inherits from System.Exception
        Assert.True(typeof(ConflictException).IsSubclassOf(typeof(Exception)));
    }

    [Fact]
    public void ConflictException_WhenCreatedWithMessage_ExposesMessageProperty()
    {
        // GIVEN: A conflict scenario (duplicate NIT)
        var message = "NIT '900.123.456-7' ya existe en el sistema";

        // WHEN: ConflictException is instantiated
        var exception = new ConflictException(message);

        // THEN: The Message property contains the provided message
        Assert.Equal(message, exception.Message);
    }

    [Fact]
    public void ConflictException_IsInDomainExceptionsNamespace()
    {
        // GIVEN: Clean Architecture mandates domain exceptions live in SiesaAgents.Domain.Exceptions
        // WHEN: We check the namespace of ConflictException
        // THEN: The namespace matches the required location
        Assert.Equal("SiesaAgents.Domain.Exceptions", typeof(ConflictException).Namespace);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Structural: exceptions are sealed (prevent inheritance of domain exceptions)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void NotFoundException_IsSealed()
    {
        // GIVEN: Domain exceptions should be sealed per story spec pattern
        // WHEN: We inspect the type
        // THEN: NotFoundException is sealed (prevents unintended subclassing)
        Assert.True(typeof(NotFoundException).IsSealed);
    }

    [Fact]
    public void ConflictException_IsSealed()
    {
        // GIVEN: Domain exceptions should be sealed per story spec pattern
        // WHEN: We inspect the type
        // THEN: ConflictException is sealed
        Assert.True(typeof(ConflictException).IsSealed);
    }
}
