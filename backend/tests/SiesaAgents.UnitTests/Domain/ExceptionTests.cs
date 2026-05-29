/**
 * Story 1.3: Backend Database Foundation — Domain Exception Edge Cases
 *
 * EDGE CASE & BOUNDARY TESTS for NotFoundException and ValidationException
 *
 * Covers:
 *   - NotFoundException single-arg constructor message stored correctly
 *   - NotFoundException entity+id overload message format (boundary: Guid, int, string ids)
 *   - NotFoundException is a subclass of System.Exception
 *   - ValidationException single-arg constructor message stored correctly
 *   - ValidationException is a subclass of System.Exception
 *   - NotFoundException is NOT a subclass of ValidationException (and vice-versa)
 *   - Both exceptions with null/empty messages (boundary)
 *   - Exception message immutability after construction
 *
 * Pattern: Arrange / Act / Assert
 * Framework: xUnit
 */

using SiesaAgents.Domain.Exceptions;
using Xunit;

namespace SiesaAgents.UnitTests.Domain;

public class NotFoundExceptionTests
{
    // ---------------------------------------------------------------------------
    // Constructor — single message string
    // ---------------------------------------------------------------------------

    /// <summary>
    /// Given NotFoundException is constructed with a plain message,
    /// When Message is read,
    /// Then it equals the provided string.
    /// </summary>
    [Fact]
    public void Constructor_WithMessage_MessagePropertyMatchesInput()
    {
        // Arrange
        const string expected = "Item was not found";

        // Act
        var ex = new NotFoundException(expected);

        // Assert
        Assert.Equal(expected, ex.Message);
    }

    /// <summary>
    /// Given NotFoundException is constructed with an empty string,
    /// When Message is read,
    /// Then it is an empty string (no default injection).
    /// </summary>
    [Fact]
    public void Constructor_WithEmptyMessage_MessageIsEmpty()
    {
        // Arrange / Act
        var ex = new NotFoundException(string.Empty);

        // Assert
        Assert.Equal(string.Empty, ex.Message);
    }

    // ---------------------------------------------------------------------------
    // Constructor — entity name + id overload
    // ---------------------------------------------------------------------------

    /// <summary>
    /// Given NotFoundException is constructed with entityName="Cliente" and a Guid id,
    /// When Message is read,
    /// Then it contains both "Cliente" and the Guid string representation.
    /// </summary>
    [Fact]
    public void Constructor_EntityId_Guid_MessageContainsEntityNameAndId()
    {
        // Arrange
        var id = Guid.NewGuid();

        // Act
        var ex = new NotFoundException("Cliente", id);

        // Assert
        Assert.Contains("Cliente", ex.Message);
        Assert.Contains(id.ToString(), ex.Message);
    }

    /// <summary>
    /// Given NotFoundException is constructed with entityName="Order" and an int id,
    /// When Message is read,
    /// Then it contains both "Order" and "42".
    /// </summary>
    [Fact]
    public void Constructor_EntityId_Int_MessageContainsEntityNameAndId()
    {
        // Act
        var ex = new NotFoundException("Order", 42);

        // Assert
        Assert.Contains("Order", ex.Message);
        Assert.Contains("42", ex.Message);
    }

    /// <summary>
    /// Given NotFoundException is constructed with entityName="Product" and a string id,
    /// When Message is read,
    /// Then it contains both "Product" and the id value.
    /// </summary>
    [Fact]
    public void Constructor_EntityId_String_MessageContainsEntityNameAndId()
    {
        // Act
        var ex = new NotFoundException("Product", "sku-001");

        // Assert
        Assert.Contains("Product", ex.Message);
        Assert.Contains("sku-001", ex.Message);
    }

    /// <summary>
    /// Given NotFoundException is constructed with an empty entityName and a Guid id,
    /// When Message is read,
    /// Then it still includes the id (boundary: empty entity name).
    /// </summary>
    [Fact]
    public void Constructor_EntityId_EmptyEntityName_MessageContainsId()
    {
        // Arrange
        var id = Guid.NewGuid();

        // Act
        var ex = new NotFoundException(string.Empty, id);

        // Assert — message must contain the id even if entity name is empty
        Assert.Contains(id.ToString(), ex.Message);
    }

    // ---------------------------------------------------------------------------
    // Inheritance and type hierarchy
    // ---------------------------------------------------------------------------

    /// <summary>
    /// NotFoundException must inherit from System.Exception so it can be caught
    /// by generic exception handlers and propagate correctly through the pipeline.
    /// </summary>
    [Fact]
    public void NotFoundException_IsAssignableFrom_SystemException()
    {
        // Assert
        Assert.True(typeof(Exception).IsAssignableFrom(typeof(NotFoundException)));
    }

    /// <summary>
    /// NotFoundException must NOT inherit from ValidationException —
    /// the middleware routes each type independently.
    /// </summary>
    [Fact]
    public void NotFoundException_IsNotSubclassOf_ValidationException()
    {
        // Assert — catching ValidationException must not catch NotFoundException
        Assert.False(typeof(ValidationException).IsAssignableFrom(typeof(NotFoundException)));
    }

    // ---------------------------------------------------------------------------
    // Throw and catch behaviour
    // ---------------------------------------------------------------------------

    /// <summary>
    /// Given NotFoundException is thrown,
    /// When caught as Exception,
    /// Then it is castable and its Message is preserved.
    /// </summary>
    [Fact]
    public void NotFoundException_WhenThrown_CanBeCaughtAsException()
    {
        // Arrange
        Exception? caught = null;

        // Act
        try
        {
            throw new NotFoundException("Resource", Guid.NewGuid());
        }
        catch (Exception ex)
        {
            caught = ex;
        }

        // Assert
        Assert.NotNull(caught);
        Assert.IsType<NotFoundException>(caught);
        Assert.False(string.IsNullOrWhiteSpace(caught!.Message));
    }

    /// <summary>
    /// Given two NotFoundException instances are created with the same entity+id,
    /// When their messages are compared,
    /// Then they are identical (deterministic formatting).
    /// </summary>
    [Fact]
    public void Constructor_EntityId_DeterministicMessageFormat()
    {
        // Arrange
        var id = Guid.Parse("00000000-0000-0000-0000-000000000001");

        // Act
        var ex1 = new NotFoundException("Item", id);
        var ex2 = new NotFoundException("Item", id);

        // Assert — same inputs always produce the same message
        Assert.Equal(ex1.Message, ex2.Message);
    }
}

public class ValidationExceptionTests
{
    // ---------------------------------------------------------------------------
    // Constructor — single message string
    // ---------------------------------------------------------------------------

    /// <summary>
    /// Given ValidationException is constructed with a message,
    /// When Message is read,
    /// Then it equals the provided string.
    /// </summary>
    [Fact]
    public void Constructor_WithMessage_MessagePropertyMatchesInput()
    {
        // Arrange
        const string expected = "Email is required";

        // Act
        var ex = new ValidationException(expected);

        // Assert
        Assert.Equal(expected, ex.Message);
    }

    /// <summary>
    /// Given ValidationException is constructed with an empty message,
    /// When Message is read,
    /// Then it is empty (no default text injected).
    /// </summary>
    [Fact]
    public void Constructor_WithEmptyMessage_MessageIsEmpty()
    {
        // Act
        var ex = new ValidationException(string.Empty);

        // Assert
        Assert.Equal(string.Empty, ex.Message);
    }

    // ---------------------------------------------------------------------------
    // Inheritance and type hierarchy
    // ---------------------------------------------------------------------------

    /// <summary>
    /// ValidationException must inherit from System.Exception so it can be caught
    /// generically and propagate correctly.
    /// </summary>
    [Fact]
    public void ValidationException_IsAssignableFrom_SystemException()
    {
        // Assert
        Assert.True(typeof(Exception).IsAssignableFrom(typeof(ValidationException)));
    }

    /// <summary>
    /// ValidationException must NOT be assignable from NotFoundException —
    /// they are parallel types in the domain hierarchy.
    /// </summary>
    [Fact]
    public void ValidationException_IsNotSubclassOf_NotFoundException()
    {
        // Assert — catching NotFoundException must not catch ValidationException
        Assert.False(typeof(NotFoundException).IsAssignableFrom(typeof(ValidationException)));
    }

    // ---------------------------------------------------------------------------
    // Throw and catch behaviour
    // ---------------------------------------------------------------------------

    /// <summary>
    /// Given ValidationException is thrown,
    /// When caught as Exception,
    /// Then it is castable and its Message is preserved.
    /// </summary>
    [Fact]
    public void ValidationException_WhenThrown_CanBeCaughtAsException()
    {
        // Arrange
        Exception? caught = null;

        // Act
        try
        {
            throw new ValidationException("Name is required");
        }
        catch (Exception ex)
        {
            caught = ex;
        }

        // Assert
        Assert.NotNull(caught);
        Assert.IsType<ValidationException>(caught);
        Assert.Equal("Name is required", caught!.Message);
    }

    /// <summary>
    /// Given a ValidationException is thrown,
    /// When caught by a catch block typed to ValidationException,
    /// Then the exact message is available.
    /// </summary>
    [Fact]
    public void ValidationException_WhenThrownAndCaughtByType_MessageIsAccessible()
    {
        // Arrange / Act
        var thrownMessage = "Max length exceeded";
        ValidationException? caught = null;

        try
        {
            throw new ValidationException(thrownMessage);
        }
        catch (ValidationException ex)
        {
            caught = ex;
        }

        // Assert
        Assert.NotNull(caught);
        Assert.Equal(thrownMessage, caught!.Message);
    }
}
