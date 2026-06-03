using SiesaAgents.Domain.Entities;
using Xunit;

namespace SiesaAgents.UnitTests.Domain;

/// <summary>
/// Edge case and boundary condition tests for the Entity base class.
/// Complements EntityTests.cs which covers the basic happy paths.
/// </summary>
public class EntityEdgeCaseTests
{
    private class ConcreteEntity : Entity { }
    private class AnotherConcreteEntity : Entity { }

    // ─── Id — boundary conditions ─────────────────────────────────────────────

    [Fact]
    public void Entity_Id_ShouldBeVersion4Guid_NotEmptyBytes()
    {
        // Arrange & Act
        var entity = new ConcreteEntity();

        // Assert — Guid.NewGuid() produces a v4 GUID with random bytes; not all-zeros
        Assert.NotEqual(Guid.Empty, entity.Id);
        // A v4 GUID will not be all 0xFF either
        Assert.NotEqual(new Guid("ffffffff-ffff-ffff-ffff-ffffffffffff"), entity.Id);
    }

    [Fact]
    public void Entity_Id_ShouldBeImmutableAfterCreation()
    {
        // Arrange
        var entity = new ConcreteEntity();
        var originalId = entity.Id;

        // Act — no public setter exists; reading Id again must return the same value
        var readAgain = entity.Id;

        // Assert — same reference equality for Guid (value type)
        Assert.Equal(originalId, readAgain);
    }

    [Fact]
    public void Entity_ShouldProduceUniqueIdsAcross100Instances()
    {
        // Boundary: verify uniqueness at scale (not just for 2 entities)
        var ids = Enumerable.Range(0, 100)
            .Select(_ => new ConcreteEntity().Id)
            .ToList();

        var distinct = ids.Distinct().Count();
        Assert.Equal(100, distinct);
    }

    // ─── Timestamps — boundary conditions ────────────────────────────────────

    [Fact]
    public void Entity_CreatedAt_ShouldBeUtcKind()
    {
        // Arrange & Act
        var entity = new ConcreteEntity();

        // Assert — DateTimeOffset.UtcNow has Offset == TimeSpan.Zero
        Assert.Equal(TimeSpan.Zero, entity.CreatedAt.Offset);
    }

    [Fact]
    public void Entity_UpdatedAt_ShouldBeUtcKind()
    {
        var entity = new ConcreteEntity();
        Assert.Equal(TimeSpan.Zero, entity.UpdatedAt.Offset);
    }

    [Fact]
    public void Entity_CreatedAt_ShouldNeverBeDateTimeOffsetDefault()
    {
        // Default(DateTimeOffset) == 0001-01-01; a real entity must have a current timestamp
        var entity = new ConcreteEntity();
        Assert.NotEqual(default(DateTimeOffset), entity.CreatedAt);
    }

    [Fact]
    public void Entity_UpdatedAt_ShouldNeverBeDateTimeOffsetDefault()
    {
        var entity = new ConcreteEntity();
        Assert.NotEqual(default(DateTimeOffset), entity.UpdatedAt);
    }

    [Fact]
    public void Entity_CreatedAt_ShouldBeCloseToUtcNow_WithinTwoSeconds()
    {
        // Boundary: timestamp must reflect actual creation time, not a hardcoded value
        var before = DateTimeOffset.UtcNow.AddSeconds(-2);
        var entity = new ConcreteEntity();
        var after = DateTimeOffset.UtcNow.AddSeconds(2);

        Assert.InRange(entity.CreatedAt, before, after);
    }

    [Fact]
    public void Entity_UpdatedAt_ShouldBeCloseToCreatedAt_OnInitialCreation()
    {
        // On creation, UpdatedAt should equal or be very close to CreatedAt
        var entity = new ConcreteEntity();
        var diff = Math.Abs((entity.UpdatedAt - entity.CreatedAt).TotalMilliseconds);

        // Allow up to 100 ms drift (same clock tick in practice)
        Assert.True(diff < 100,
            $"UpdatedAt should be within 100ms of CreatedAt on creation. Diff was {diff}ms");
    }

    // ─── Inheritance — different subtypes share no static state ──────────────

    [Fact]
    public void DifferentEntitySubtypes_ShouldHaveIndependentIds()
    {
        // Ensures no static Guid field is accidentally shared across subclass instances
        var a = new ConcreteEntity();
        var b = new AnotherConcreteEntity();

        Assert.NotEqual(a.Id, b.Id);
    }

    // ─── Protected setters — immutability from outside the hierarchy ─────────

    [Fact]
    public void Entity_Id_ShouldHaveNoPublicSetter()
    {
        // Verify by reflection that the Id property has no public set accessor
        var prop = typeof(Entity).GetProperty(nameof(Entity.Id));
        Assert.NotNull(prop);
        var setter = prop!.GetSetMethod(nonPublic: false); // public setter only
        Assert.Null(setter); // must be null → no public setter
    }

    [Fact]
    public void Entity_CreatedAt_ShouldHaveNoPublicSetter()
    {
        var prop = typeof(Entity).GetProperty(nameof(Entity.CreatedAt));
        Assert.NotNull(prop);
        Assert.Null(prop!.GetSetMethod(nonPublic: false));
    }

    [Fact]
    public void Entity_UpdatedAt_ShouldHaveNoPublicSetter()
    {
        var prop = typeof(Entity).GetProperty(nameof(Entity.UpdatedAt));
        Assert.NotNull(prop);
        Assert.Null(prop!.GetSetMethod(nonPublic: false));
    }
}
