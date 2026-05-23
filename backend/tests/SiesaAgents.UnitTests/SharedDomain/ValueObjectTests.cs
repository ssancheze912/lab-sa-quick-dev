using Shared.Domain;

namespace SiesaAgents.UnitTests.SharedDomain;

/// <summary>
/// Unit tests for Shared.Domain.ValueObject base class.
/// Story 1.1 — edge cases and boundary conditions.
/// </summary>
public class ValueObjectTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Concrete test doubles
    // ─────────────────────────────────────────────────────────────────────────

    private sealed class Money : ValueObject
    {
        public decimal Amount { get; }
        public string Currency { get; }

        public Money(decimal amount, string currency)
        {
            Amount = amount;
            Currency = currency;
        }

        protected override IEnumerable<object?> GetEqualityComponents()
        {
            yield return Amount;
            yield return Currency;
        }
    }

    private sealed class Email : ValueObject
    {
        public string Value { get; }

        public Email(string value) => Value = value;

        protected override IEnumerable<object?> GetEqualityComponents()
        {
            yield return Value.ToLowerInvariant();
        }
    }

    private sealed class NullableValueObject : ValueObject
    {
        public string? NullableField { get; }

        public NullableValueObject(string? value) => NullableField = value;

        protected override IEnumerable<object?> GetEqualityComponents()
        {
            yield return NullableField;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Equals — structural equality
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Equals_ReturnsTrue_ForTwoInstancesWithSameComponents()
    {
        var a = new Money(100m, "USD");
        var b = new Money(100m, "USD");
        Assert.Equal(a, b);
    }

    [Fact]
    public void Equals_ReturnsFalse_WhenAmountDiffers()
    {
        var a = new Money(100m, "USD");
        var b = new Money(200m, "USD");
        Assert.NotEqual(a, b);
    }

    [Fact]
    public void Equals_ReturnsFalse_WhenCurrencyDiffers()
    {
        var a = new Money(100m, "USD");
        var b = new Money(100m, "EUR");
        Assert.NotEqual(a, b);
    }

    [Fact]
    public void Equals_ReturnsFalse_WhenComparedWithNull()
    {
        var a = new Money(100m, "USD");
        Assert.False(a.Equals(null));
    }

    [Fact]
    public void Equals_ReturnsFalse_ForDifferentTypes()
    {
        var money = new Money(100m, "USD");
        var email = new Email("test@example.com");
        // Even if we pass an Email where Money is expected, types differ
        Assert.False(money.Equals(email));
    }

    [Fact]
    public void Equals_HandlesNullComponents_Correctly()
    {
        var a = new NullableValueObject(null);
        var b = new NullableValueObject(null);
        Assert.Equal(a, b);
    }

    [Fact]
    public void Equals_ReturnsFalse_WhenOneComponentIsNullAndOtherIsNot()
    {
        var a = new NullableValueObject(null);
        var b = new NullableValueObject("value");
        Assert.NotEqual(a, b);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GetHashCode — consistency with equality
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void GetHashCode_IsEqual_ForTwoEqualValueObjects()
    {
        var a = new Money(100m, "USD");
        var b = new Money(100m, "USD");
        Assert.Equal(a.GetHashCode(), b.GetHashCode());
    }

    [Fact]
    public void GetHashCode_IsDifferent_ForTwoUnequalValueObjects()
    {
        var a = new Money(100m, "USD");
        var b = new Money(200m, "EUR");
        Assert.NotEqual(a.GetHashCode(), b.GetHashCode());
    }

    [Fact]
    public void GetHashCode_IsStable_ForSameInstance()
    {
        var vo = new Money(42m, "COP");
        Assert.Equal(vo.GetHashCode(), vo.GetHashCode());
    }

    [Fact]
    public void GetHashCode_HandlesNullComponent_WithoutThrowing()
    {
        var vo = new NullableValueObject(null);
        var exception = Record.Exception(() => vo.GetHashCode());
        Assert.Null(exception);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Equality operators == and !=
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void EqualityOperator_ReturnsTrue_ForEqualValueObjects()
    {
        var a = new Money(50m, "COP");
        var b = new Money(50m, "COP");
        Assert.True(a == b);
    }

    [Fact]
    public void InequalityOperator_ReturnsTrue_ForDifferentValueObjects()
    {
        var a = new Money(50m, "COP");
        var b = new Money(100m, "COP");
        Assert.True(a != b);
    }

    [Fact]
    public void EqualityOperator_ReturnsFalse_WhenRightIsNull()
    {
        var a = new Money(50m, "COP");
        Assert.False(a == null);
    }

    [Fact]
    public void EqualityOperator_ReturnsFalse_WhenLeftIsNull()
    {
        Money? left = null;
        var right = new Money(50m, "COP");
        Assert.False(left == right);
    }

    [Fact]
    public void EqualityOperator_ReturnsTrue_WhenBothAreNull()
    {
        Money? left = null;
        Money? right = null;
        Assert.True(left == right);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: single-component value objects
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void SingleComponentValueObject_EqualityWorksCorrectly()
    {
        var a = new Email("User@Example.COM");
        var b = new Email("user@example.com");
        // Email normalises to lowercase — both should be equal
        Assert.Equal(a, b);
    }
}
